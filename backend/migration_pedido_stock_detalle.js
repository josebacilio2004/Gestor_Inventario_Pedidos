// Migration: crear tabla pedido_stock_detalle
// Ejecutar: node backend/migration_pedido_stock_detalle.js

const pool = require('./config/database');

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query(`
            CREATE TABLE IF NOT EXISTS pedido_stock_detalle (
                id              SERIAL PRIMARY KEY,
                pedido_id       INT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
                tipo            TEXT NOT NULL CHECK (tipo IN ('Pico', 'Zapapico')),
                cantidad        INT NOT NULL CHECK (cantidad >= 0),
                asignado        BOOLEAN NOT NULL DEFAULT FALSE,
                tanda_id        INT REFERENCES tandas(id),
                marca_asignada  TEXT CHECK (marca_asignada IN ('Tramontina', 'Bellota', NULL)),
                created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_psd_pedido_id ON pedido_stock_detalle(pedido_id);
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_psd_asignado ON pedido_stock_detalle(asignado);
        `);

        await client.query('COMMIT');
        console.log('✅ Tabla pedido_stock_detalle creada correctamente.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error en migración:', err.message);
        process.exit(1);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
