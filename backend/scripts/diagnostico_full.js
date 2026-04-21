const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/database');

async function check() {
    try {
        console.log('--- DIAGNÓSTICO DE BASE DE DATOS ---');
        
        // 1. Verificar tanda activa
        const tRes = await pool.query("SELECT * FROM tandas WHERE estado = 'activa' LIMIT 1");
        const tandaActiva = tRes.rows[0];
        console.log('Tanda Activa:', tandaActiva);

        if (tandaActiva) {
            // 2. Verificar stock de la tanda activa
            const sRes = await pool.query('SELECT * FROM stock_herramientas WHERE tanda_id = $1', [tandaActiva.id]);
            console.log('Registros de Stock:', sRes.rows);
            
            // Ver si faltan tipos (Pico/Zapapico)
            const tipos = sRes.rows.map(r => r.tipo);
            if (!tipos.includes('Pico')) console.log('⚠️ ADVERTENCIA: Falta registro de Pico en tanda activa.');
            if (!tipos.includes('Zapapico')) console.log('⚠️ ADVERTENCIA: Falta registro de Zapapico en tanda activa.');
        } else {
            console.log('❌ No hay tanda activa.');
        }

        // 3. Ver última venta mayorista
        const vRes = await pool.query(`
            SELECT v.id, v.total, v.created_at, c.nombre as cliente
            FROM ventas_mayoristas v
            JOIN clientes_mayoristas c ON c.id = v.cliente_id
            ORDER BY v.created_at DESC LIMIT 1
        `);
        console.log('Última venta registrada:', vRes.rows[0]);
        if (vRes.rows[0]) {
            const dRes = await pool.query('SELECT * FROM detalles_venta_mayorista WHERE venta_id = $1', [vRes.rows[0].id]);
            console.log('Detalles de la última venta:', dRes.rows);
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
        process.exit();
    }
}

check();
