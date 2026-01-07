const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET - Obtener todos los inversionistas (incluye password para login)
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT i.*, 
                COALESCE(COUNT(DISTINCT p.id), 0) as total_pedidos,
                COALESCE(SUM(p.capital_invertido), 0) as capital_total_invertido,
                COALESCE(SUM(p.capital_devuelto), 0) as capital_total_devuelto,
                COALESCE(SUM(p.capital_pendiente), 0) as capital_total_pendiente,
                COALESCE(SUM(p.ganancia_real), 0) as ganancia_total_real
            FROM inversionistas i
            LEFT JOIN pedidos p ON i.id = p.inversionista_id
            GROUP BY i.id
            ORDER BY i.nombre ASC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener inversionistas:', err);
        res.status(500).json({ error: 'Error al obtener inversionistas' });
    }
});

// GET - Obtener inversionista por ID con detalle completo
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Datos del inversionista
        const inversionista = await pool.query(
            'SELECT * FROM inversionistas WHERE id = $1',
            [id]
        );

        if (inversionista.rows.length === 0) {
            return res.status(404).json({ error: 'Inversionista no encontrado' });
        }

        // Pedidos del inversionista
        const pedidos = await pool.query(
            `SELECT 
        p.*,
        prod.nombre as producto_nombre,
        d.nombre as distribuidor_nombre,
        c.nombre as comprador_nombre
      FROM pedidos p
      LEFT JOIN productos prod ON p.producto_id = prod.id
      LEFT JOIN distribuidores d ON p.distribuidor_id = d.id
      LEFT JOIN compradores c ON p.comprador_id = c.id
      WHERE p.inversionista_id = $1
      ORDER BY p.fecha_pedido DESC`,
            [id]
        );

        // Resumen
        const resumen = await pool.query(
            'SELECT * FROM vista_inversionistas_resumen WHERE id = $1',
            [id]
        );

        res.json({
            ...inversionista.rows[0],
            pedidos: pedidos.rows,
            resumen: resumen.rows[0]
        });
    } catch (err) {
        console.error('Error al obtener inversionista:', err);
        res.status(500).json({ error: 'Error al obtener inversionista' });
    }
});

// POST - Crear nuevo inversionista
router.post('/', async (req, res) => {
    try {
        const { nombre, contacto, telefono, email, notas } = req.body;

        if (!nombre) {
            return res.status(400).json({
                error: 'El nombre del inversionista es obligatorio'
            });
        }

        const result = await pool.query(
            `INSERT INTO inversionistas (nombre, contacto, telefono, email, notas) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
            [nombre, contacto, telefono, email, notas]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error al crear inversionista:', err);
        res.status(500).json({ error: 'Error al crear inversionista' });
    }
});

// PUT - Actualizar inversionista
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, contacto, telefono, email, notas } = req.body;

        const result = await pool.query(
            `UPDATE inversionistas 
       SET nombre = $1, contacto = $2, telefono = $3, email = $4, notas = $5
       WHERE id = $6 
       RETURNING *`,
            [nombre, contacto, telefono, email, notas, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Inversionista no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al actualizar inversionista:', err);
        res.status(500).json({ error: 'Error al actualizar inversionista' });
    }
});

// DELETE - Eliminar inversionista
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM inversionistas WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Inversionista no encontrado' });
        }

        res.json({ message: 'Inversionista eliminado exitosamente' });
    } catch (err) {
        console.error('Error al eliminar inversionista:', err);
        if (err.code === '23503') {
            return res.status(400).json({
                error: 'No se puede eliminar el inversionista porque tiene pedidos asociados'
            });
        }
        res.status(500).json({ error: 'Error al eliminar inversionista' });
    }
});

module.exports = router;
