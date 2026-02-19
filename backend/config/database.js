const { Pool } = require('pg');
require('dotenv').config();

const isNeon = (process.env.DATABASE_URL || '').includes('neon.tech');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/gestor_inventario',
    ssl: isNeon ? { rejectUnauthorized: false } : (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false)
});

// Prueba de conexión
pool.on('connect', () => {
    console.log('✓ Conectado a PostgreSQL');
});

pool.on('error', (err) => {
    console.error('Error inesperado en PostgreSQL:', err);
});

module.exports = pool;
