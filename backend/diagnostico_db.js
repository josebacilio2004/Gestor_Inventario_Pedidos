const pool = require('./config/database');

async function check() {
    try {
        const res = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'pedido_stock_detalle'
            );
        `);
        const exists = res.rows[0].exists;
        if (exists) {
            console.log('✅ La tabla "pedido_stock_detalle" EXISTE.');
            const count = await pool.query('SELECT COUNT(*) FROM pedido_stock_detalle');
            console.log(`📊 Registros en la tabla: ${count.rows[0].count}`);
        } else {
            console.log('❌ La tabla "pedido_stock_detalle" NO EXISTE.');
            console.log('👉 Debes ejecutar: node backend/migration_pedido_stock_detalle.js');
        }
    } catch (err) {
        console.error('❌ Error al conectar con la base de datos:', err.message);
    } finally {
        await pool.end();
    }
}

check();
