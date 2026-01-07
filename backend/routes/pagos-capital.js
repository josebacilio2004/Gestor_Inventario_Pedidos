const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET - Obtener historial de pagos de un pedido
router.get('/pedido/:pedido_id', async (req, res) => {
    try {
        const { pedido_id } = req.params;

        const result = await pool.query(
            `SELECT * FROM pagos_capital 
       WHERE pedido_id = $1 
       ORDER BY fecha_pago DESC, created_at DESC`,
            [pedido_id]
        );

        // Calcular totales
        const totales = await pool.query(
            `SELECT 
        SUM(monto) as total_pagado,
        COUNT(*) as num_pagos,
        MAX(fecha_pago) as ultimo_pago
       FROM pagos_capital 
       WHERE pedido_id = $1`,
            [pedido_id]
        );

        res.json({
            pagos: result.rows,
            resumen: totales.rows[0]
        });
    } catch (err) {
        console.error('Error al obtener pagos:', err);
        res.status(500).json({ error: 'Error al obtener pagos' });
    }
});

// GET - Obtener un pago específico
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'SELECT * FROM pagos_capital WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pago no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al obtener pago:', err);
        res.status(500).json({ error: 'Error al obtener pago' });
    }
});

// POST - Registrar nuevo pago de capital
router.post('/', async (req, res) => {
    try {
        const {
            pedido_id,
            monto,
            fecha_pago,
            tipo_pago,
            metodo_pago,
            comprobante,
            notas
        } = req.body;

        if (!pedido_id || !monto || !fecha_pago) {
            return res.status(400).json({
                error: 'pedido_id, monto y fecha_pago son obligatorios'
            });
        }

        if (monto <= 0) {
            return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
        }

        // Verificar que el pedido existe y obtener info
        const pedido = await pool.query(
            'SELECT capital_invertido, capital_devuelto FROM pedidos WHERE id = $1',
            [pedido_id]
        );

        if (pedido.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        // Verificar que no se exceda el capital
        const capitalRestante = pedido.rows[0].capital_invertido - pedido.rows[0].capital_devuelto;
        if (tipo_pago === 'capital' && monto > capitalRestante) {
            return res.status(400).json({
                error: `El monto excede el capital pendiente (${capitalRestante})`
            });
        }

        const result = await pool.query(
            `INSERT INTO pagos_capital 
       (pedido_id, monto, fecha_pago, tipo_pago, metodo_pago, comprobante, notas) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
            [pedido_id, monto, fecha_pago, tipo_pago || 'capital', metodo_pago, comprobante, notas]
        );

        // ACTUALIZACIÓN AUTOMÁTICA: Recalcular totales y estado del pedido
        await pool.query(
            `UPDATE pedidos 
             SET capital_devuelto = (
               SELECT COALESCE(SUM(monto), 0) FROM pagos_capital WHERE pedido_id = $1
             ),
             estado = CASE 
               WHEN (capital_invertido - (SELECT COALESCE(SUM(monto), 0) FROM pagos_capital WHERE pedido_id = $1)) <= 0.01 
                 AND COALESCE(ganancia_pendiente, 0) <= 0.01 
               THEN 'completado' 
               ELSE 'pendiente' 
             END
             WHERE id = $1`,
            [pedido_id]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error al registrar pago:', err);
        res.status(500).json({ error: 'Error al registrar pago' });
    }
});

// PUT - Actualizar pago
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            monto,
            fecha_pago,
            tipo_pago,
            metodo_pago,
            comprobante,
            notas
        } = req.body;

        const result = await pool.query(
            `UPDATE pagos_capital 
       SET monto = $1, fecha_pago = $2, tipo_pago = $3, 
           metodo_pago = $4, comprobante = $5, notas = $6
       WHERE id = $7 
       RETURNING *`,
            [monto, fecha_pago, tipo_pago, metodo_pago, comprobante, notas, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pago no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al actualizar pago:', err);
        res.status(500).json({ error: 'Error al actualizar pago' });
    }
});

// DELETE - Eliminar pago
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM pagos_capital WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pago no encontrado' });
        }

        res.json({ message: 'Pago eliminado exitosamente' });
    } catch (err) {
        console.error('Error al eliminar pago:', err);
        res.status(500).json({ error: 'Error al eliminar pago' });
    }
});

module.exports = router;
