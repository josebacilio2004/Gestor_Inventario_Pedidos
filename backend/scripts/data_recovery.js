const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/database');

async function recover() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        console.log('🔄 Iniciando recuperación de datos...');

        // 1. Restaurar registro de Picos para la Tanda 3 (Activa)
        // Verificamos si existe antes de insertar
        const checkPico = await client.query(
            "SELECT * FROM stock_herramientas WHERE tanda_id = 3 AND tipo = 'Pico'"
        );
        
        if (checkPico.rows.length === 0) {
            await client.query(`
                INSERT INTO stock_herramientas (tanda_id, tipo, cantidad, minimo_alerta)
                VALUES (3, 'Pico', 0, 100)
            `);
            console.log('✅ Registro de "Pico" restaurado para la Tanda 3.');
        } else {
            console.log('ℹ️ El registro de "Pico" ya existe.');
        }

        // 2. Eliminar Venta Mayorista #2 e items asociados
        // Nota: Los detalles se borran por CASCADE si la FK está configurada, 
        // pero lo haremos explícito por seguridad si no.
        const saleId = 2;
        await client.query('DELETE FROM detalles_venta_mayorista WHERE venta_id = $1', [saleId]);
        const delSale = await client.query('DELETE FROM ventas_mayoristas WHERE id = $1 RETURNING *', [saleId]);
        
        if (delSale.rows.length > 0) {
            console.log(`✅ Venta #${saleId} eliminada correctamente. El stock se recalculará automáticamente.`);
        } else {
            console.log(`ℹ️ La venta #${saleId} no existía o ya fue eliminada.`);
        }

        await client.query('COMMIT');
        console.log('✨ Recuperación completada con éxito.');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error durante la recuperación:', err.message);
    } finally {
        client.release();
        await pool.end();
        process.exit();
    }
}

recover();
