const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET - Obtener todos los compradores (incluye password para login)
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.*, 
                COALESCE(COUNT(DISTINCT p.id), 0) as total_pedidos,
                COALESCE(SUM(p.capital_invertido), 0) as capital_total_gestionado,
                COALESCE(SUM(p.capital_devuelto), 0) as capital_devuelto,
                COALESCE(SUM(p.capital_pendiente), 0) as capital_pendiente_devolver,
                COALESCE(SUM(p.ganancia_real), 0) as ganancia_generada
            FROM compradores c
            LEFT JOIN pedidos p ON c.id = p.comprador_id
            GROUP BY c.id
            ORDER BY c.nombre ASC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener compradores:', err);
        res.status(500).json({ error: 'Error al obtener compradores' });
    }
});

// GET - Obtener comprador por ID con detalle
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const comprador = await pool.query(
            'SELECT * FROM compradores WHERE id = $1',
            [id]
        );

        if (comprador.rows.length === 0) {
            return res.status(404).json({ error: 'Comprador no encontrado' });
        }

        // Pedidos gestionados por el comprador
        const pedidos = await pool.query(
            `SELECT 
        p.*,
        prod.nombre as producto_nombre,
        d.nombre as distribuidor_nombre,
        i.nombre as inversionista_nombre
      FROM pedidos p
      LEFT JOIN productos prod ON p.producto_id = prod.id
      LEFT JOIN distribuidores d ON p.distribuidor_id = d.id
      LEFT JOIN inversionistas i ON p.inversionista_id = i.id
      WHERE p.comprador_id = $1
      ORDER BY p.fecha_pedido DESC`,
            [id]
        );

        const resumen = await pool.query(
            'SELECT * FROM vista_compradores_resumen WHERE id = $1',
            [id]
        );

        res.json({
            ...comprador.rows[0],
            pedidos: pedidos.rows,
            resumen: resumen.rows[0]
        });
    } catch (err) {
        console.error('Error al obtener comprador:', err);
        res.status(500).json({ error: 'Error al obtener comprador' });
    }
});

// POST - Crear nuevo comprador
router.post('/', async (req, res) => {
    try {
        const { nombre, contacto, telefono, email, notas } = req.body;

        if (!nombre) {
            return res.status(400).json({
                error: 'El nombre del comprador es obligatorio'
            });
        }

        const result = await pool.query(
            `INSERT INTO compradores (nombre, contacto, telefono, email, notas) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
            [nombre, contacto, telefono, email, notas]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error al crear comprador:', err);
        res.status(500).json({ error: 'Error al crear comprador' });
    }
});

// PUT - Actualizar comprador
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, contacto, telefono, email, notas } = req.body;

        const result = await pool.query(
            `UPDATE compradores 
       SET nombre = $1, contacto = $2, telefono = $3, email = $4, notas = $5
       WHERE id = $6 
       RETURNING *`,
            [nombre, contacto, telefono, email, notas, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Comprador no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al actualizar comprador:', err);
        res.status(500).json({ error: 'Error al actualizar comprador' });
    }
});

// DELETE - Eliminar comprador
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM compradores WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Comprador no encontrado' });
        }

        res.json({ message: 'Comprador eliminado exitosamente' });
    } catch (err) {
        console.error('Error al eliminar comprador:', err);
        if (err.code === '23503') {
            return res.status(400).json({
                error: 'No se puede eliminar el comprador porque tiene pedidos asociados'
            });
        }
        res.status(500).json({ error: 'Error al eliminar comprador' });
    }
});

module.exports = router;
