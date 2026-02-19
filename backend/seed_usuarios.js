const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function seed() {
    try {
        console.log('Conectando a Neon...');

        const hash_admin = await bcrypt.hash('admin123', 10);
        const hash_demo = await bcrypt.hash('demo123', 10);

        await pool.query(
            `INSERT INTO usuarios_admin (nombre, usuario, password_hash, email)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (usuario) DO UPDATE SET password_hash = $3`,
            ['Administrador', 'admin', hash_admin, 'admin@comercializadoraaly.com']
        );
        console.log('OK admin / admin123');

        await pool.query(
            `INSERT INTO inversionistas (nombre, usuario, password_hash, contacto, activo)
             VALUES ($1, $2, $3, $4, true)
             ON CONFLICT (usuario) DO UPDATE SET password_hash = $3`,
            ['Samira', 'ssamira', hash_demo, 'Samira']
        );
        console.log('OK ssamira / demo123');

        await pool.query(
            `INSERT INTO compradores (nombre, usuario, password_hash, contacto, activo)
             VALUES ($1, $2, $3, $4, true)
             ON CONFLICT (usuario) DO UPDATE SET password_hash = $3`,
            ['Alicia', 'alicia', hash_demo, 'Alicia']
        );
        console.log('OK alicia / demo123');

        console.log('\nListo! Todos los usuarios creados.');

    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await pool.end();
    }
}

seed();
