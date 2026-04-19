const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcryptjs');

// POST - Iniciar sesión Inversionista
router.post('/login', async (req, res) => {
    try {
        const { usuario, password } = req.body;
        if (!usuario || !password) return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });

        const result = await pool.query('SELECT * FROM inversionistas WHERE usuario = $1 AND activo = true', [usuario]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Credenciales incorrectas o usuario inactivo' });

        const inversionista = result.rows[0];

        // Comprobar contraseña (soporta bcrypt)
        const isMatch = await bcrypt.compare(password, inversionista.password_hash);
        if (!isMatch) return res.status(401).json({ error: 'Credenciales incorrectas' });

        res.json({
            id: inversionista.id,
            nombre: inversionista.nombre,
            usuario: inversionista.usuario,
            rol: 'inversionista'
        });
    } catch (err) {
        console.error('Error en login inversionista:', err);
        res.status(500).json({ error: 'Error interno en login' });
    }
});

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

        // Pedidos del inversionista con Fuente de Verdad (Sumatoria de pagos reales)
        const pedidos = await pool.query(
            `SELECT 
                p.*,
                prod.nombre as producto_nombre,
                d.nombre as distribuidor_nombre,
                c.nombre as comprador_nombre,
                COALESCE((SELECT SUM(monto) FROM pagos_capital WHERE pedido_id = p.id), 0) as capital_devuelto,
                COALESCE((SELECT SUM(monto) FROM pagos_ganancia WHERE pedido_id = p.id), 0) as ganancia_devuelta_real
            FROM pedidos p
            LEFT JOIN productos prod ON p.producto_id = prod.id
            LEFT JOIN distribuidores d ON p.distribuidor_id = d.id
            LEFT JOIN compradores c ON p.comprador_id = c.id
            WHERE p.inversionista_id = $1
            ORDER BY p.fecha_pedido DESC`,
            [id]
        );

        // Calcular resumen directamente con Fuente de Verdad (Pagos Reales)
        const statsResult = await pool.query(
            `SELECT 
                COALESCE(SUM(p.capital_invertido), 0) as capital_total,
                COALESCE((SELECT SUM(pc.monto) FROM pagos_capital pc JOIN pedidos p2 ON pc.pedido_id = p2.id WHERE p2.inversionista_id = $1), 0) as capital_devuelto_total,
                COUNT(p.id) as total_pedidos,
                COALESCE(SUM(CASE WHEN p.ganancia_real > 0 THEN p.ganancia_real ELSE (CASE WHEN p.estado = 'completado' THEN p.ganancia_esperada ELSE 0 END) END), 0) as ganancia_total,
                COALESCE((SELECT SUM(pg.monto) FROM pagos_ganancia pg JOIN pedidos p3 ON pg.pedido_id = p3.id WHERE p3.inversionista_id = $1), 0) as ganancia_devuelta_total
            FROM pedidos p
            WHERE p.inversionista_id = $1`,
            [id]
        );

        const stats = statsResult.rows[0];
        const capitalTotal = parseFloat(stats.capital_total || 0);
        const capitalDevuelto = parseFloat(stats.capital_devuelto_total || 0);
        const gananciaTotal = parseFloat(stats.ganancia_total || 0);
        const gananciaDevuelta = parseFloat(stats.ganancia_devuelta_total || 0);

        const resumen = {
            capital_total_invertido: capitalTotal,
            capital_total_devuelto: capitalDevuelto,
            capital_total_pendiente: Math.max(0, capitalTotal - capitalDevuelto),
            total_pedidos: parseInt(stats.total_pedidos || 0),
            ganancia_total_real: gananciaTotal,
            ganancia_devuelta: gananciaDevuelta,
            ganancia_pendiente: Math.max(0, gananciaTotal - gananciaDevuelta),
            porcentaje_devolucion: capitalTotal > 0
                ? parseFloat(((capitalDevuelto / capitalTotal) * 100).toFixed(1))
                : 0
        };

        // Enriquecer pedidos con cálculos de pendiente
        const pedidosFinal = pedidos.rows.map(p => ({
            ...p,
            capital_pendiente: Math.max(0, parseFloat(p.capital_invertido || 0) - parseFloat(p.capital_devuelto || 0)),
            // Si el pedido está completado pero la ganancia_real es 0, usamos ganancia_esperada para el display
            ganancia_real_display: parseFloat(p.ganancia_real) > 0 ? p.ganancia_real : (p.estado === 'completado' ? p.ganancia_esperada : 0)
        }));

        res.json({
            ...inversionista.rows[0],
            pedidos: pedidosFinal,
            resumen
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
