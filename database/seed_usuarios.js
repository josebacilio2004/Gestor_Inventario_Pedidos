/**
 * Script para crear usuarios en Neon
 * Ejecutar: node database/seed_usuarios.js
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: './backend/.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const usuarios = [
    // Admin
    {
        tabla: 'usuarios_admin',
        campos: { nombre: 'Administrador', usuario: 'admin', password: 'admin123', email: 'admin@comercializadoraaly.com' }
    },
    // Inversionista
    {
        tabla: 'inversionistas',
        campos: { nombre: 'Samira', usuario: 'ssamira', password: 'demo123', contacto: 'Samira', telefono: '' }
    },
    // Comprador
    {
        tabla: 'compradores',
        campos: { nombre: 'Alicia', usuario: 'alicia', password: 'demo123', contacto: 'Alicia', telefono: '' }
    }
];

async function seed() {
    try {
        console.log('🔗 Conectando a Neon...');

        for (const u of usuarios) {
            const { tabla, campos } = u;
            const hash = await bcrypt.hash(campos.password, 10);

            if (tabla === 'usuarios_admin') {
                await pool.query(
                    `INSERT INTO usuarios_admin (nombre, usuario, password_hash, email)
                     VALUES ($1, $2, $3, $4)
                     ON CONFLICT (usuario) DO UPDATE SET password_hash = $3`,
                    [campos.nombre, campos.usuario, hash, campos.email]
                );
            } else if (tabla === 'inversionistas') {
                await pool.query(
                    `INSERT INTO inversionistas (nombre, usuario, password_hash, contacto, telefono, activo)
                     VALUES ($1, $2, $3, $4, $5, true)
                     ON CONFLICT (usuario) DO UPDATE SET password_hash = $3`,
                    [campos.nombre, campos.usuario, hash, campos.contacto, campos.telefono]
                );
            } else if (tabla === 'compradores') {
                await pool.query(
                    `INSERT INTO compradores (nombre, usuario, password_hash, contacto, telefono, activo)
                     VALUES ($1, $2, $3, $4, $5, true)
                     ON CONFLICT (usuario) DO UPDATE SET password_hash = $3`,
                    [campos.nombre, campos.usuario, hash, campos.contacto, campos.telefono]
                );
            }

            console.log(`✅ Usuario "${campos.usuario}" creado/actualizado en ${tabla}`);
        }

        console.log('\n🎉 Todos los usuarios fueron creados exitosamente!');
        console.log('\nCredenciales:');
        console.log('  Admin:         admin / admin123');
        console.log('  Inversionista: ssamira / demo123');
        console.log('  Comprador:     alicia / demo123');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

seed();
