const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/database');

async function update() {
    console.log('💰 Ajustando precios generales (15 - 20 soles)...');
    try {
        // Actualizar todos los productos que NO sean Tramontina ni Bellota
        // Los pondremos en un punto medio de S/ 18.00 como estándar
        const res = await pool.query(
            "UPDATE productos SET precio_referencia = 18.00 WHERE nombre NOT ILIKE '%Tramontina%' AND nombre NOT ILIKE '%Bellota%' RETURNING id, nombre"
        );
        
        console.log(`✅ ${res.rowCount} productos actualizados a S/ 18.00:`);
        res.rows.forEach(p => console.log(`   - ${p.nombre}`));

    } catch (err) {
        console.error('❌ Error al actualizar precios:', err);
    } finally {
        await pool.end();
        process.exit();
    }
}

update();
