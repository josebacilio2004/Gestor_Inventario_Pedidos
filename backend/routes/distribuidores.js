const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET - Obtener todos los distribuidores
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM distribuidores ORDER BY nombre ASC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener distribuidores:', err);
        res.status(500).json({ error: 'Error al obtener distribuidores' });
    }
});

// GET - Obtener distribuidor por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM distribuidores WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Distribuidor no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al obtener distribuidor:', err);
        res.status(500).json({ error: 'Error al obtener distribuidor' });
    }
});

// POST - Crear nuevo distribuidor
router.post('/', async (req, res) => {
    try {
        const { nombre, contacto, telefono, email, direccion } = req.body;

        if (!nombre) {
            return res.status(400).json({
                error: 'El nombre del distribuidor es obligatorio'
            });
        }

        const result = await pool.query(
            `INSERT INTO distribuidores (nombre, contacto, telefono, email, direccion) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
            [nombre, contacto, telefono, email, direccion]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error al crear distribuidor:', err);
        res.status(500).json({ error: 'Error al crear distribuidor' });
    }
});

// PUT - Actualizar distribuidor
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, contacto, telefono, email, direccion } = req.body;

        const result = await pool.query(
            `UPDATE distribuidores 
       SET nombre = $1, contacto = $2, telefono = $3, email = $4, direccion = $5
       WHERE id = $6 
       RETURNING *`,
            [nombre, contacto, telefono, email, direccion, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Distribuidor no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al actualizar distribuidor:', err);
        res.status(500).json({ error: 'Error al actualizar distribuidor' });
    }
});

// DELETE - Eliminar distribuidor
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM distribuidores WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Distribuidor no encontrado' });
        }

        res.json({ message: 'Distribuidor eliminado exitosamente' });
    } catch (err) {
        console.error('Error al eliminar distribuidor:', err);
        if (err.code === '23503') {
            return res.status(400).json({
                error: 'No se puede eliminar el distribuidor porque tiene pedidos asociados'
            });
        }
        res.status(500).json({ error: 'Error al eliminar distribuidor' });
    }
});

module.exports = router;
