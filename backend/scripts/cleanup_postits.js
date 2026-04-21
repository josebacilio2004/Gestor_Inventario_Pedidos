const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/database');

async function cleanup() {
    try {
        console.log('🧹 Limpiando notas duplicadas...');
        
        // Buscar duplicados (mismo tanda_id, contenido y color)
        const res = await pool.query(`
            SELECT tanda_id, contenido, color, COUNT(*), MIN(id) as keep_id
            FROM tanda_notas
            GROUP BY tanda_id, contenido, color
            HAVING COUNT(*) > 1
        `);

        if (res.rows.length === 0) {
            console.log('✅ No se encontraron notas duplicadas.');
            return;
        }

        for (const row of res.rows) {
            console.log(`🗑️ Eliminando duplicados de: "${row.contenido.substring(0, 20)}..."`);
            const delRes = await pool.query(
                "DELETE FROM tanda_notas WHERE tanda_id = $1 AND contenido = $2 AND color = $3 AND id > $4 RETURNING id",
                [row.tanda_id, row.contenido, row.color, row.keep_id]
            );
            console.log(`✅ ${delRes.rowCount} notas duplicadas eliminadas.`);
        }

    } catch (err) {
        console.error('❌ Error durante la limpieza:', err.message);
    } finally {
        await pool.end();
        process.exit();
    }
}

cleanup();
