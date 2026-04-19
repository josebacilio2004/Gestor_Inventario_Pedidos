const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/database');

async function update() {
    console.log('💰 Sincronizando Precios de Compra para Venta con margen del 40%...');
    try {
        // 1. Herramientas Generales (Meta venta: S/ 15-20)
        // Base S/ 13.00 * 1.4 = S/ 18.20
        await pool.query(
            "UPDATE productos SET precio_referencia = 13.00 WHERE nombre NOT ILIKE '%Tramontina%' AND nombre NOT ILIKE '%Bellota%'"
        );
        console.log('✅ Herramientas generales actualizadas (Compra: S/ 13.00, Catálogo: S/ 18.20)');

        // 2. Herramientas de Marca (Meta venta: S/ 20-25)
        // Base S/ 16.50 * 1.4 = S/ 23.10
        await pool.query(
            "UPDATE productos SET precio_referencia = 16.50 WHERE nombre ILIKE '%Tramontina%' OR nombre ILIKE '%Bellota%'"
        );
        console.log('✅ Herramientas de marca actualizadas (Compra: S/ 16.50, Catálogo: S/ 23.10)');

    } catch (err) {
        console.error('❌ Error al sincronizar precios:', err);
    } finally {
        await pool.end();
        process.exit();
    }
}

update();
