const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/database');

async function check() {
    try {
        const res = await pool.query('SELECT id, nombre, precio_compra, precio_venta, precio_referencia FROM productos');
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
        process.exit();
    }
}
check();
