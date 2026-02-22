const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// ── GET /   Listar todas las tandas ─────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT t.*,
                   o.nombre AS operador_nombre,
                   (SELECT COUNT(*)           FROM pedidos_herramientas p WHERE p.tanda_id = t.id)::int                AS total_pedidos,
                   (SELECT COALESCE(SUM(p.total_mano_obra), 0) FROM pedidos_herramientas p WHERE p.tanda_id = t.id)   AS total_mano_obra,
                   (SELECT COALESCE(SUM(s.cantidad), 0) FROM stock_herramientas s WHERE s.tanda_id = t.id)            AS total_stock
            FROM tandas t
            LEFT JOIN operadores o ON t.operador_id = o.id
            ORDER BY t.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener tandas', detail: err.message });
    }
});

// ── GET /activa   Tanda activa actual ─────────────────────────────────
router.get('/activa', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT t.*,
                   o.nombre AS operador_nombre,
                   json_agg(s ORDER BY s.tipo) AS stock
            FROM tandas t
            LEFT JOIN operadores    o ON t.operador_id = o.id
            LEFT JOIN stock_herramientas s ON s.tanda_id = t.id
            WHERE t.estado = 'activa'
            GROUP BY t.id, o.nombre
            LIMIT 1
        `);
        if (result.rows.length === 0)
            return res.status(404).json({ error: 'No hay ninguna tanda activa' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener tanda activa', detail: err.message });
    }
});

// ── GET /:id   Detalle de una tanda ──────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const tanda = await pool.query('SELECT * FROM tandas WHERE id = $1', [id]);
        if (!tanda.rows.length) return res.status(404).json({ error: 'Tanda no encontrada' });

        const stock = await pool.query('SELECT * FROM stock_herramientas WHERE tanda_id = $1 ORDER BY tipo', [id]);
        const pedidos = await pool.query(`
            SELECT ph.*, c.nombre AS comprador_nombre,
                   COALESCE(json_agg(i ORDER BY i.id) FILTER (WHERE i.id IS NOT NULL), '[]') AS items
            FROM pedidos_herramientas ph
            LEFT JOIN compradores c ON ph.comprador_id = c.id
            LEFT JOIN items_pedido_herramienta i ON i.pedido_id = ph.id
            WHERE ph.tanda_id = $1
            GROUP BY ph.id, c.nombre
            ORDER BY ph.created_at DESC
        `, [id]);

        res.json({ ...tanda.rows[0], stock: stock.rows, pedidos: pedidos.rows });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener tanda', detail: err.message });
    }
});

// ── POST /   Crear nueva tanda ────────────────────────────────────────
// Body: { nombre, descripcion?, operador_id, picos, zapapicos, minimo_alerta? }
router.post('/', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { nombre, descripcion, operador_id, picos = 0, zapapicos = 0, minimo_alerta = 100 } = req.body;

        if (!nombre) return res.status(400).json({ error: 'El nombre de la tanda es requerido' });

        // Insertar tanda (el trigger cierra la activa anterior automáticamente)
        const tandaRes = await client.query(`
            INSERT INTO tandas (nombre, descripcion, operador_id, estado)
            VALUES ($1, $2, $3, 'activa')
            RETURNING *
        `, [nombre, descripcion || null, operador_id || null]);
        const tanda = tandaRes.rows[0];

        // Crear filas de stock con los valores iniciales ingresados
        await client.query(`
            INSERT INTO stock_herramientas (tanda_id, tipo, cantidad, minimo_alerta)
            VALUES ($1, 'Pico', $2, $3),
                   ($1, 'Zapapico', $4, $3)
        `, [tanda.id, Number(picos), Number(minimo_alerta), Number(zapapicos)]);

        await client.query('COMMIT');

        // Devolver tanda + stock
        const stockRes = await pool.query('SELECT * FROM stock_herramientas WHERE tanda_id = $1 ORDER BY tipo', [tanda.id]);
        res.status(201).json({ ...tanda, stock: stockRes.rows });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: 'Error al crear tanda', detail: err.message });
    } finally {
        client.release();
    }
});

// ── PATCH /:id/cerrar   Cerrar una tanda manualmente ─────────────────
router.patch('/:id/cerrar', async (req, res) => {
    try {
        const result = await pool.query(`
            UPDATE tandas SET estado = 'cerrada', fecha_cierre = CURRENT_DATE, updated_at = NOW()
            WHERE id = $1 AND estado = 'activa'
            RETURNING *
        `, [req.params.id]);
        if (!result.rows.length) return res.status(404).json({ error: 'Tanda no encontrada o ya cerrada' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al cerrar tanda', detail: err.message });
    }
});

// ── POST /:id/stock/agregar   Añadir stock a una tanda ───────────────
// Body: { tipo, cantidad }
router.post('/:id/stock/agregar', async (req, res) => {
    try {
        const { tipo, cantidad } = req.body;
        if (!tipo || !cantidad || Number(cantidad) <= 0)
            return res.status(400).json({ error: 'tipo y cantidad > 0 requeridos' });

        const result = await pool.query(`
            UPDATE stock_herramientas
            SET cantidad = cantidad + $3, updated_at = NOW()
            WHERE tanda_id = $1 AND tipo = $2
            RETURNING *
        `, [req.params.id, tipo, Number(cantidad)]);

        if (!result.rows.length)
            return res.status(404).json({ error: 'No se encontró stock para ese tipo en esta tanda' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al agregar stock', detail: err.message });
    }
});

module.exports = router;
