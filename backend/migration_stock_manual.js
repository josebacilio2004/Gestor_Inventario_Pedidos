const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('Iniciando migración de DB (Adición de stock manual)...');

        const ddl = `
        CREATE TABLE IF NOT EXISTS ingresos_stock_comprador (
            id SERIAL PRIMARY KEY,
            comprador_id INT NOT NULL REFERENCES compradores(id),
            tipo VARCHAR(50) NOT NULL,
            marca VARCHAR(50) NOT NULL,
            cantidad INT NOT NULL CHECK (cantidad > 0),
            fecha TIMESTAMPTZ DEFAULT NOW(),
            notas TEXT
        );
    `;

        await client.query(ddl);
        console.log('Tabla ingresos_stock_comprador creada o ya existente.');

    } catch (err) {
        console.error('Error durante la migración:', err);
    } finally {
        client.release();
        pool.end();
        console.log('Proceso finalizado.');
    }
}

runMigration();
