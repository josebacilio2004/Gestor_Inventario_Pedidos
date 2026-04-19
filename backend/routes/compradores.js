const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcryptjs');

// POST - Iniciar sesión Comprador
router.post('/login', async (req, res) => {
    try {
        const { usuario, password } = req.body;
        if (!usuario || !password) return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });

        const result = await pool.query('SELECT * FROM compradores WHERE usuario = $1 AND activo = true', [usuario]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Credenciales incorrectas o usuario inactivo' });

        const comprador = result.rows[0];

        // Comprobar contraseña (soporta bcrypt)
        const isMatch = await bcrypt.compare(password, comprador.password_hash);
        if (!isMatch) return res.status(401).json({ error: 'Credenciales incorrectas' });

        res.json({
            id: comprador.id,
            nombre: comprador.nombre,
            usuario: comprador.usuario,
            rol: 'comprador'
        });
    } catch (err) {
        console.error('Error en login comprador:', err);
        res.status(500).json({ error: 'Error interno en login' });
    }
});

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

        // Pedidos gestionados por el comprador (con datos de ganancias)
        const pedidos = await pool.query(
            `SELECT 
        p.*,
        prod.nombre as producto_nombre,
        d.nombre as distribuidor_nombre,
        i.nombre as inversionista_nombre,
        COALESCE((
            SELECT SUM(pc.monto) FROM pagos_capital pc WHERE pc.pedido_id = p.id
        ), 0) AS capital_pagado_real,
        COALESCE((
            SELECT SUM(pg.monto) FROM pagos_ganancia pg WHERE pg.pedido_id = p.id
        ), 0) AS ganancia_devuelta_real
      FROM pedidos p
      LEFT JOIN productos prod ON p.producto_id = prod.id
      LEFT JOIN distribuidores d ON p.distribuidor_id = d.id
      LEFT JOIN inversionistas i ON p.inversionista_id = i.id
      WHERE p.comprador_id = $1
      ORDER BY p.fecha_pedido DESC`,
            [id]
        );

        // Calcular resumen robusto desde Fuente de Verdad (Pagos Reales)
        const statsResult = await pool.query(
            `SELECT 
                COALESCE(SUM(p.capital_invertido), 0) as capital_total,
                COALESCE(SUM(CASE WHEN p.estado = 'completado' THEN p.capital_invertido ELSE (SELECT COALESCE(SUM(monto),0) FROM pagos_capital WHERE pedido_id = p.id) END), 0) as capital_devuelto_total,
                COUNT(p.id) as total_pedidos,
                COALESCE(SUM(CASE WHEN p.estado = 'completado' THEN p.ganancia_esperada ELSE (SELECT COALESCE(SUM(monto),0) FROM pagos_ganancia WHERE pedido_id = p.id) END), 0) as ganancia_total,
                COALESCE((SELECT SUM(pg.monto) FROM pagos_ganancia pg JOIN pedidos p3 ON pg.pedido_id = p3.id WHERE p3.comprador_id = $1), 0) as ganancia_devuelta_total
            FROM pedidos p
            WHERE p.comprador_id = $1`,
            [id]
        );

        const stats = statsResult.rows[0];
        const capitalTotal = parseFloat(stats.capital_total || 0);
        const capitalDevuelto = parseFloat(stats.capital_devuelto_total || 0);
        const gananciaTotal = parseFloat(stats.ganancia_total || 0);

        const resumen = {
            capital_total_gestionado: capitalTotal,
            capital_devuelto: capitalDevuelto,
            capital_pendiente_devolver: Math.max(0, capitalTotal - capitalDevuelto),
            total_pedidos: parseInt(stats.total_pedidos || 0),
            ganancia_generada: gananciaTotal,
            ganancia_devuelta: parseFloat(stats.ganancia_devuelta_total || 0),
            porcentaje_devuelto: capitalTotal > 0
                ? parseFloat(((capitalDevuelto / capitalTotal) * 100).toFixed(1))
                : 0
        };

        res.json({
            ...comprador.rows[0],
            pedidos: pedidos.rows,
            resumen
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
