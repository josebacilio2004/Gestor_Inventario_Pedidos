const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/database');

async function update() {
    console.log('💰 Actualizando precios de productos...');
    try {
        const resTramontina = await pool.query(
            "UPDATE productos SET precio_referencia = 22.00 WHERE nombre LIKE '%Tramontina%' RETURNING id"
        );
        console.log(`✅ ${resTramontina.rowCount} productos Tramontina actualizados a S/ 22.00`);

        const resBellota = await pool.query(
            "UPDATE productos SET precio_referencia = 25.00 WHERE nombre LIKE '%Bellota%' RETURNING id"
        );
        console.log(`✅ ${resBellota.rowCount} productos Bellota actualizados a S/ 25.00`);

    } catch (err) {
        console.error('❌ Error al actualizar precios:', err);
    } finally {
        await pool.end();
        process.exit();
    }
}

update();
