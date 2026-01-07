const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET - Obtener pagos de ganancia de un pedido
router.get('/', async (req, res) => {
    try {
        const { pedido_id } = req.query;

        let query = 'SELECT * FROM pagos_ganancia';
        const params = [];

        if (pedido_id) {
            query += ' WHERE pedido_id = $1';
            params.push(pedido_id);
        }

        query += ' ORDER BY fecha_pago DESC, created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener pagos de ganancia:', err);
        res.status(500).json({ error: 'Error al obtener pagos de ganancia' });
    }
});

// POST - Registrar nuevo pago de ganancia
router.post('/', async (req, res) => {
    try {
        const { pedido_id, monto, fecha_pago, notas } = req.body;

        if (!pedido_id || !monto || !fecha_pago) {
            return res.status(400).json({
                error: 'pedido_id, monto y fecha_pago son requeridos'
            });
        }

        // Verificar que el pedido existe
        const pedido = await pool.query(
            'SELECT ganancia_real, ganancia_devuelta FROM pedidos WHERE id = $1',
            [pedido_id]
        );

        if (pedido.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        const gananciaReal = parseFloat(pedido.rows[0].ganancia_real);
        const gananciaDevuelta = parseFloat(pedido.rows[0].ganancia_devuelta || 0);
        const gananciaPendiente = gananciaReal - gananciaDevuelta;

        if (parseFloat(monto) > gananciaPendiente) {
            return res.status(400).json({
                error: `El monto excede la ganancia pendiente (S/ ${gananciaPendiente.toFixed(2)})`
            });
        }

        const result = await pool.query(
            `INSERT INTO pagos_ganancia (pedido_id, monto, fecha_pago, notas) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
            [pedido_id, monto, fecha_pago, notas]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error al registrar pago de ganancia:', err);
        res.status(500).json({ error: 'Error al registrar pago de ganancia' });
    }
});

// DELETE - Eliminar pago de ganancia
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM pagos_ganancia WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pago no encontrado' });
        }

        res.json({ message: 'Pago eliminado exitosamente', pago: result.rows[0] });
    } catch (err) {
        console.error('Error al eliminar pago:', err);
        res.status(500).json({ error: 'Error al eliminar pago' });
    }
});

module.exports = router;
