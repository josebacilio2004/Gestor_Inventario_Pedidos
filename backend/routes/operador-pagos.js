const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// ── GET /:tanda_id   Listar pagos de una tanda ─────────────────────────
router.get('/:tanda_id', async (req, res) => {
    try {
        const { tanda_id } = req.params;
        const result = await pool.query(`
            SELECT p.*, o.nombre AS operador_nombre
            FROM pagos_operadores p
            JOIN operadores o ON p.operador_id = o.id
            WHERE p.tanda_id = $1
            ORDER BY p.fecha DESC
        `, [tanda_id]);

        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener pagos del operador:', err);
        res.status(500).json({ error: 'Error al obtener pagos', detail: err.message });
    }
});

// ── POST /   Registrar un nuevo pago ───────────────────────────────────
router.post('/', async (req, res) => {
    try {
        const { operador_id, tanda_id, monto, metodo_pago, notas } = req.body;

        if (!operador_id || !tanda_id || !monto || monto <= 0) {
            return res.status(400).json({ error: 'Datos incompletos o monto inválido' });
        }

        const result = await pool.query(`
            INSERT INTO pagos_operadores (operador_id, tanda_id, monto, metodo_pago, notas)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [operador_id, tanda_id, monto, metodo_pago, notas]);

        res.status(201).json({
            mensaje: 'Pago registrado exitosamente',
            pago: result.rows[0]
        });
    } catch (err) {
        console.error('Error al registrar pago del operador:', err);
        res.status(500).json({ error: 'Error al registrar pago', detail: err.message });
    }
});

module.exports = router;
