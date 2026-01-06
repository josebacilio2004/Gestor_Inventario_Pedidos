const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET - Obtener estadísticas generales
router.get('/stats', async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT 
        COUNT(*) as total_pedidos,
        SUM(capital_invertido) as capital_total,
        SUM(ganancia_esperada) as ganancia_esperada_total,
        SUM(ganancia_real) as ganancia_real_total,
        SUM(devolucion_capital) as devolucion_total,
        COUNT(CASE WHEN estado = 'completado' THEN 1 END) as pedidos_completados,
        COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pedidos_pendientes
      FROM pedidos
    `);

        const stats = result.rows[0];

        // Calcular ganancia neta y margen
        const gananciaNeta = parseFloat(stats.ganancia_real_total || 0);
        const capitalTotal = parseFloat(stats.capital_total || 0);
        const margenGanancia = capitalTotal > 0
            ? ((gananciaNeta / capitalTotal) * 100).toFixed(2)
            : 0;

        res.json({
            ...stats,
            ganancia_neta: gananciaNeta,
            margen_ganancia: margenGanancia
        });
    } catch (err) {
        console.error('Error al obtener estadísticas:', err);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

// GET - Obtener todos los pedidos con información completa
router.get('/', async (req, res) => {
    try {
        const { estado, fecha_inicio, fecha_fin } = req.query;

        let query = `
      SELECT 
        p.*,
        prod.nombre as producto_nombre,
        prod.tipo_producto,
        d.nombre as distribuidor_nombre,
        i.nombre as inversionista_nombre,
        c.nombre as comprador_nombre
      FROM pedidos p
      LEFT JOIN productos prod ON p.producto_id = prod.id
      LEFT JOIN distribuidores d ON p.distribuidor_id = d.id
      LEFT JOIN inversionistas i ON p.inversionista_id = i.id
      LEFT JOIN compradores c ON p.comprador_id = c.id
      WHERE 1=1
    `;

        const params = [];
        let paramCount = 1;

        if (estado) {
            query += ` AND p.estado = $${paramCount}`;
            params.push(estado);
            paramCount++;
        }

        if (fecha_inicio) {
            query += ` AND p.fecha_pedido >= $${paramCount}`;
            params.push(fecha_inicio);
            paramCount++;
        }

        if (fecha_fin) {
            query += ` AND p.fecha_pedido <= $${paramCount}`;
            params.push(fecha_fin);
            paramCount++;
        }

        query += ' ORDER BY p.fecha_pedido DESC, p.created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener pedidos:', err);
        res.status(500).json({ error: 'Error al obtener pedidos' });
    }
});

// GET - Obtener pedido por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT 
        p.*,
        prod.nombre as producto_nombre,
        prod.tipo_producto,
        prod.precio_referencia,
        d.nombre as distribuidor_nombre,
        d.contacto as distribuidor_contacto
      FROM pedidos p
      LEFT JOIN productos prod ON p.producto_id = prod.id
      LEFT JOIN distribuidores d ON p.distribuidor_id = d.id
      LEFT JOIN inversionistas i ON p.inversionista_id = i.id
      LEFT JOIN compradores c ON p.comprador_id = c.id
      WHERE p.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al obtener pedido:', err);
        res.status(500).json({ error: 'Error al obtener pedido' });
    }
});

// POST - Crear nuevo pedido
router.post('/', async (req, res) => {
    try {
        const {
            fecha_pedido,
            producto_id,
            distribuidor_id,
            inversionista_id,
            comprador_id,
            cantidad,
            capital_invertido,
            ganancia_esperada,
            ganancia_real,
            ganancia_devuelta,
            fecha_ganancia_devuelta,
            devolucion_capital,
            estado,
            notas
        } = req.body;

        // Validaciones
        if (!fecha_pedido || !producto_id || !distribuidor_id || !cantidad ||
            capital_invertido === undefined || ganancia_esperada === undefined) {
            return res.status(400).json({
                error: 'Faltan campos obligatorios: fecha_pedido, producto_id, distribuidor_id, cantidad, capital_invertido, ganancia_esperada'
            });
        }

        if (cantidad <= 0) {
            return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });
        }

        if (capital_invertido < 0 || ganancia_esperada < 0) {
            return res.status(400).json({ error: 'Capital y ganancia no pueden ser negativos' });
        }

        const result = await pool.query(
            `INSERT INTO pedidos 
       (fecha_pedido, producto_id, distribuidor_id, inversionista_id, comprador_id,
        cantidad, capital_invertido, ganancia_esperada, ganancia_real, 
        ganancia_devuelta, fecha_ganancia_devuelta, devolucion_capital, estado, notas) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
       RETURNING *`,
            [
                fecha_pedido,
                producto_id,
                distribuidor_id,
                inversionista_id,
                comprador_id,
                cantidad,
                capital_invertido,
                ganancia_esperada,
                ganancia_real || 0,
                ganancia_devuelta || false,
                fecha_ganancia_devuelta,
                devolucion_capital || 0,
                estado || 'pendiente',
                notas
            ]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error al crear pedido:', err);
        if (err.code === '23503') {
            return res.status(400).json({
                error: 'Producto o distribuidor no válido'
            });
        }
        res.status(500).json({ error: 'Error al crear pedido' });
    }
});

// PUT - Actualizar pedido
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            fecha_pedido,
            producto_id,
            distribuidor_id,
            cantidad,
            capital_invertido,
            ganancia_esperada,
            ganancia_real,
            devolucion_capital,
            estado,
            notas
        } = req.body;

        const result = await pool.query(
            `UPDATE pedidos 
       SET fecha_pedido = $1, producto_id = $2, distribuidor_id = $3,
           cantidad = $4, capital_invertido = $5, ganancia_esperada = $6,
           ganancia_real = $7, devolucion_capital = $8, estado = $9, notas = $10
       WHERE id = $11 
       RETURNING *`,
            [
                fecha_pedido,
                producto_id,
                distribuidor_id,
                cantidad,
                capital_invertido,
                ganancia_esperada,
                ganancia_real,
                devolucion_capital,
                estado,
                notas,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al actualizar pedido:', err);
        res.status(500).json({ error: 'Error al actualizar pedido' });
    }
});

// DELETE - Eliminar pedido
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM pedidos WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        res.json({ message: 'Pedido eliminado exitosamente' });
    } catch (err) {
        console.error('Error al eliminar pedido:', err);
        res.status(500).json({ error: 'Error al eliminar pedido' });
    }
});

module.exports = router;
