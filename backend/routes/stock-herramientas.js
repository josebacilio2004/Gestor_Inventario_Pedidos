const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// ── GET: todo el stock ────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM stock_herramientas ORDER BY tipo ASC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener stock:', err);
        res.status(500).json({ error: 'Error al obtener stock', detail: err.message });
    }
});

// ── POST /agregar : operador suma unidades por TIPO ───
// Body: { tipo, cantidad }
router.post('/agregar', async (req, res) => {
    try {
        const { tipo, cantidad } = req.body;
        if (!tipo || !cantidad || Number(cantidad) <= 0) {
            return res.status(400).json({ error: 'tipo y cantidad > 0 son requeridos' });
        }

        const result = await pool.query(`
            INSERT INTO stock_herramientas (tipo, cantidad)
            VALUES ($1, $2)
            ON CONFLICT (tipo) DO UPDATE
                SET cantidad   = stock_herramientas.cantidad + EXCLUDED.cantidad,
                    updated_at = NOW()
            RETURNING *
        `, [tipo, Number(cantidad)]);

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al agregar stock:', err);
        res.status(500).json({ error: 'Error al agregar stock', detail: err.message });
    }
});

// ── PATCH /ajustar : corrección manual (total absoluto) ──
// Body: { tipo, cantidad }
router.patch('/ajustar', async (req, res) => {
    try {
        const { tipo, cantidad } = req.body;
        if (!tipo || cantidad === undefined || cantidad < 0) {
            return res.status(400).json({ error: 'tipo y cantidad >= 0 requeridos' });
        }

        const result = await pool.query(`
            UPDATE stock_herramientas
            SET cantidad = $2, updated_at = NOW()
            WHERE tipo = $1
            RETURNING *
        `, [tipo, Number(cantidad)]);

        if (result.rows.length === 0)
            return res.status(404).json({ error: 'Tipo de herramienta no encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al ajustar stock', detail: err.message });
    }
});

module.exports = router;
