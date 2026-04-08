const { Pool } = require('pg');
require('dotenv').config();

const isNeon = (process.env.DATABASE_URL || '').includes('neon.tech');

if (!process.env.DATABASE_URL) {
    console.warn('⚠️ ADVERTENCIA: DATABASE_URL no está definida. Usando base de datos local por defecto.');
} else {
    console.log(`📡 Intentando conectar a la base de datos (${isNeon ? 'Neon' : 'Otro/Local'})...`);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/gestor_inventario',
    ssl: isNeon ? { rejectUnauthorized: false } : (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false)
});

// Prueba de conexión inicial
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ ERROR FATAL DE CONEXIÓN A BASE DE DATOS:', err.message);
    } else {
        console.log('✓ Conexión exitosa a PostgreSQL iniciada en:', res.rows[0].now);
    }
});

// Prueba de conexión
pool.on('connect', () => {
    console.log('✓ Conectado a PostgreSQL');
});

pool.on('error', (err) => {
    console.error('Error inesperado en PostgreSQL:', err);
});

module.exports = pool;
