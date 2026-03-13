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
        c.nombre as comprador_nombre,
        (SELECT json_agg(json_build_object(
            'producto_id', pp.producto_id,
            'cantidad', pp.cantidad,
            'nombre', pr.nombre
        )) FROM pedidos_productos pp 
           JOIN productos pr ON pp.producto_id = pr.id 
           WHERE pp.pedido_id = p.id) as items
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
        d.contacto as distribuidor_contacto,
        (SELECT json_agg(json_build_object(
            'producto_id', pp.producto_id,
            'cantidad', pp.cantidad,
            'nombre', pr.nombre
        )) FROM pedidos_productos pp 
           JOIN productos pr ON pp.producto_id = pr.id 
           WHERE pp.pedido_id = p.id) as items
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
    let client;
    try {
        const {
            fecha_pedido,
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
            notas,
            items // [{ producto_id, cantidad }]
        } = req.body;

        // Validaciones
        if (!fecha_pedido || !distribuidor_id || !cantidad ||
            capital_invertido === undefined || ganancia_esperada === undefined || !items || !items.length) {
            return res.status(400).json({
                error: 'Faltan campos obligatorios: fecha_pedido, distribuidor_id, cantidad, capital_invertido, ganancia_esperada, items'
            });
        }

        client = await pool.connect();
        await client.query('BEGIN');

        // 1. Insertar el pedido principal
        // Nota: producto_id sigue siendo NOT NULL en la DB original, usaremos el primero como referencia o quitaremos el constraint si es posible.
        // Como solución temporal para no romper la DB, usaremos el ID del primer item como "producto principal"
        const main_producto_id = items[0].producto_id;

        const result = await client.query(
            `INSERT INTO pedidos 
       (fecha_pedido, producto_id, distribuidor_id, inversionista_id, comprador_id,
        cantidad, capital_invertido, ganancia_esperada, ganancia_real, 
        ganancia_devuelta, fecha_ganancia_devuelta, devolucion_capital, estado, notas) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
       RETURNING *`,
            [
                fecha_pedido,
                main_producto_id,
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
        const nuevoPedido = result.rows[0];

        // 2. Insertar desglose de productos y generar stock detalle automáticamente
        for (const item of items) {
            // Guardar en la tabla de relación (si existe la tabla, si no, al menos procesamos el stock)
            try {
                await client.query(
                    `INSERT INTO pedidos_productos (pedido_id, producto_id, cantidad) VALUES ($1, $2, $3)`,
                    [nuevoPedido.id, item.producto_id, item.cantidad]
                );
            } catch (e) {
                console.log("Tabla pedidos_productos no existe aún o error al insertar, ignorando...");
            }

            // Detección automática para el operador por cada producto del pedido
            const prodRes = await client.query('SELECT nombre FROM productos WHERE id = $1', [item.producto_id]);
            if (prodRes.rows.length > 0) {
                const nombreProd = prodRes.rows[0].nombre.toLowerCase();
                let tipoHerramienta = null;

                if (nombreProd.includes('zapapico')) {
                    tipoHerramienta = 'Zapapico';
                } else if (nombreProd.includes('pico')) {
                    tipoHerramienta = 'Pico';
                }

                if (tipoHerramienta) {
                    await client.query(
                        `INSERT INTO pedido_stock_detalle (pedido_id, tipo, cantidad, producto_id) VALUES ($1, $2, $3, $4)`,
                        [nuevoPedido.id, tipoHerramienta, item.cantidad, item.producto_id]
                    );
                }
            }
        }

        await client.query('COMMIT');
        res.status(201).json(nuevoPedido);
    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('Error al crear pedido:', err);
        if (err.code === '23503') {
            return res.status(400).json({
                error: 'Producto o distribuidor no válido'
            });
        }
        res.status(500).json({
            error: 'Error al crear pedido',
            detail: err.message,
            code: err.code
        });
    } finally {
        if (client) client.release();
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
