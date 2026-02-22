const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// ── GET: obtener todo el stock ────────────────────
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM stock_herramientas ORDER BY tipo ASC, marca ASC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener stock:', err);
        res.status(500).json({ error: 'Error al obtener stock' });
    }
});

// ── GET /:tipo/:marca  (1 registro) ──────────────
router.get('/:tipo/:marca', async (req, res) => {
    try {
        const { tipo, marca } = req.params;
        const result = await pool.query(
            'SELECT * FROM stock_herramientas WHERE tipo = $1 AND marca = $2',
            [tipo, marca]
        );
        if (result.rows.length === 0)
            return res.status(404).json({ error: 'Stock no encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener stock' });
    }
});

// ── POST /agregar : el operador añade unidades ───
// Body: { tipo, marca, cantidad }
router.post('/agregar', async (req, res) => {
    try {
        const { tipo, marca, cantidad } = req.body;
        if (!tipo || !marca || !cantidad || Number(cantidad) <= 0)
            return res.status(400).json({ error: 'tipo, marca y cantidad > 0 son requeridos' });

        const result = await pool.query(`
            INSERT INTO stock_herramientas (tipo, marca, cantidad)
            VALUES ($1, $2, $3)
            ON CONFLICT (tipo, marca) DO UPDATE
                SET cantidad   = stock_herramientas.cantidad + EXCLUDED.cantidad,
                    updated_at = NOW()
            RETURNING *
        `, [tipo, marca, Number(cantidad)]);

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al agregar stock:', err);
        res.status(500).json({ error: 'Error al agregar stock' });
    }
});

// ── PATCH /ajustar : corrección manual (solo admin) ──
// Body: { tipo, marca, cantidad }  ← nuevo total absoluto
router.patch('/ajustar', async (req, res) => {
    try {
        const { tipo, marca, cantidad } = req.body;
        if (cantidad === undefined || cantidad < 0)
            return res.status(400).json({ error: 'cantidad >= 0 requerido' });

        const result = await pool.query(`
            UPDATE stock_herramientas
            SET cantidad = $3, updated_at = NOW()
            WHERE tipo = $1 AND marca = $2
            RETURNING *
        `, [tipo, marca, Number(cantidad)]);

        if (result.rows.length === 0)
            return res.status(404).json({ error: 'Registro de stock no encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al ajustar stock' });
    }
});

module.exports = router;
