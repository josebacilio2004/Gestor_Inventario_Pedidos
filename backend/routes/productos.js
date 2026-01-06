const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET - Obtener todos los productos
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM productos ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener productos:', err);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

// GET - Obtener producto por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM productos WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al obtener producto:', err);
        res.status(500).json({ error: 'Error al obtener producto' });
    }
});

// POST - Crear nuevo producto
router.post('/', async (req, res) => {
    try {
        const { nombre, descripcion, tipo_producto, precio_referencia } = req.body;

        if (!nombre || !tipo_producto) {
            return res.status(400).json({
                error: 'Nombre y tipo de producto son obligatorios'
            });
        }

        const result = await pool.query(
            `INSERT INTO productos (nombre, descripcion, tipo_producto, precio_referencia) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
            [nombre, descripcion, tipo_producto, precio_referencia]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error al crear producto:', err);
        res.status(500).json({ error: 'Error al crear producto' });
    }
});

// PUT - Actualizar producto
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, tipo_producto, precio_referencia } = req.body;

        const result = await pool.query(
            `UPDATE productos 
       SET nombre = $1, descripcion = $2, tipo_producto = $3, precio_referencia = $4
       WHERE id = $5 
       RETURNING *`,
            [nombre, descripcion, tipo_producto, precio_referencia, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al actualizar producto:', err);
        res.status(500).json({ error: 'Error al actualizar producto' });
    }
});

// DELETE - Eliminar producto
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM productos WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json({ message: 'Producto eliminado exitosamente' });
    } catch (err) {
        console.error('Error al eliminar producto:', err);
        if (err.code === '23503') {
            return res.status(400).json({
                error: 'No se puede eliminar el producto porque tiene pedidos asociados'
            });
        }
        res.status(500).json({ error: 'Error al eliminar producto' });
    }
});

module.exports = router;
