const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/database');

const newProducts = [
    {
        nombre: 'Pico Tramontina Profesional',
        descripcion: 'Herramienta forjada de alta resistencia. Ideal para trabajos de excavación pesada. Acabado premium.',
        tipo_producto: 'Pico',
        precio_referencia: 150.00,
        imagen_url: 'assets/pico_tramontina.png'
    },
    {
        nombre: 'Zapapico Tramontina Forjado',
        descripcion: 'Diseño ergonómico y durabilidad extrema. Mango de alta calidad con refuerzo industrial.',
        tipo_producto: 'Zapapico',
        precio_referencia: 165.00,
        imagen_url: 'assets/zapapico_tramontina.png'
    },
    {
        nombre: 'Pico Bellota Acero Especial',
        descripcion: 'Forjado en una sola pieza. Acero de alta calidad con tratamiento térmico diferencial.',
        tipo_producto: 'Pico',
        precio_referencia: 185.00,
        imagen_url: 'assets/pico_bellota.png'
    },
    {
        nombre: 'Zapapico Bellota Premium',
        descripcion: 'Herramienta de precisión para agricultura y construcción. Máxima vida útil y resistencia.',
        tipo_producto: 'Zapapico',
        precio_referencia: 195.00,
        imagen_url: 'assets/zapapico_bellota.png'
    }
];

async function seed() {
    console.log('🌱 Iniciando carga de nuevos productos...');
    try {
        for (const p of newProducts) {
            // Verificar si ya existe por nombre para evitar duplicados
            const exist = await pool.query('SELECT id FROM productos WHERE nombre = $1', [p.nombre]);
            if (exist.rows.length === 0) {
                await pool.query(
                    `INSERT INTO productos (nombre, descripcion, tipo_producto, precio_referencia, imagen_url) 
                     VALUES ($1, $2, $3, $4, $5)`,
                    [p.nombre, p.descripcion, p.tipo_producto, p.precio_referencia, p.imagen_url]
                );
                console.log(`✅ Producto añadido: ${p.nombre}`);
            } else {
                console.log(`🟡 El producto ya existe: ${p.nombre}`);
            }
        }
        console.log('✨ Carga completada con éxito.');
    } catch (err) {
        console.error('❌ Error al cargar productos:', err);
    } finally {
        await pool.end();
        process.exit();
    }
}

seed();
