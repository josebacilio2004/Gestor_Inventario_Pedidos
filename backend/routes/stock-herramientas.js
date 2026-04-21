const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Helper: obtener tanda activa
async function getTandaActiva(client) {
    const res = await client.query("SELECT id FROM tandas WHERE estado = 'activa' LIMIT 1");
    return res.rows[0] || null;
}

// ── GET /   Stock de la tanda activa ────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const tanda = await getTandaActiva(pool);
        if (!tanda) return res.status(404).json({ error: 'No hay ninguna tanda activa' });

        const result = await pool.query(
            'SELECT * FROM stock_herramientas WHERE tanda_id = $1 ORDER BY tipo',
            [tanda.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener stock', detail: err.message });
    }
});

// ── POST /agregar   Agregar stock a la tanda activa ─────────────────
// Body: { tipo, cantidad }
router.post('/agregar', async (req, res) => {
    try {
        const { tipo, cantidad } = req.body;
        if (!tipo || !cantidad || Number(cantidad) <= 0)
            return res.status(400).json({ error: 'tipo y cantidad > 0 son requeridos' });

        const tanda = await getTandaActiva(pool);
        if (!tanda) return res.status(409).json({ error: 'No hay ninguna tanda activa. Crea una tanda primero.' });

        // Usamos INSERT ... ON CONFLICT para que si el registro fue borrado accidentalmente,
        // se cree de nuevo en lugar de dar error 404.
        const result = await pool.query(`
            INSERT INTO stock_herramientas (tanda_id, tipo, cantidad, updated_at)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (tanda_id, tipo) 
            DO UPDATE SET 
                cantidad = stock_herramientas.cantidad + EXCLUDED.cantidad,
                updated_at = NOW()
            RETURNING *
        `, [tanda.id, tipo, Number(cantidad)]);

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al agregar stock', detail: err.message });
    }
});

// ── PATCH /ajustar   Ajuste absoluto (admin) ──────────────────────
// Body: { tipo, cantidad }
router.patch('/ajustar', async (req, res) => {
    try {
        const { tipo, cantidad } = req.body;
        if (!tipo || cantidad === undefined || cantidad < 0)
            return res.status(400).json({ error: 'tipo y cantidad >= 0 requeridos' });

        const tanda = await getTandaActiva(pool);
        if (!tanda) return res.status(409).json({ error: 'No hay tanda activa' });

        const result = await pool.query(`
            UPDATE stock_herramientas
            SET cantidad = $3, updated_at = NOW()
            WHERE tanda_id = $1 AND tipo = $2
            RETURNING *
        `, [tanda.id, tipo, Number(cantidad)]);

        if (!result.rows.length) return res.status(404).json({ error: 'Tipo no encontrado en tanda activa' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al ajustar stock', detail: err.message });
    }
});

module.exports = router;
