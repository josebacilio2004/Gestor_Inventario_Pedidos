const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Tarifas de mano de obra (por cada 120 unidades)
const TARIFAS_MANO_OBRA = {
    'Pico-Tramontina': { base: 120, tarifa: 50 },
    'Pico-Bellota': { base: 120, tarifa: 65 },
    'Zapapico-Tramontina': { base: 120, tarifa: 50 },
    'Zapapico-Bellota': { base: 120, tarifa: 65 },
};

function calcularManoObra(tipo, marca, cantidad) {
    const key = `${tipo}-${marca}`;
    const config = TARIFAS_MANO_OBRA[key];
    if (!config) return 0;
    return parseFloat(((cantidad / config.base) * config.tarifa).toFixed(2));
}

// GET - Obtener todos los pedidos (con items y nombres)
router.get('/', async (req, res) => {
    try {
        const { operador_id, comprador_id, estado } = req.query;

        let query = `
            SELECT 
                ph.id, ph.estado, ph.notas, ph.total_mano_obra,
                ph.created_at, ph.updated_at,
                o.nombre as operador_nombre,
                c.nombre as comprador_nombre,
                ph.operador_id, ph.comprador_id,
                (SELECT json_agg(
                    json_build_object(
                        'id', i.id, 'tipo', i.tipo, 'marca', i.marca,
                        'cantidad', i.cantidad, 'mano_obra', i.mano_obra
                    )
                ) FROM items_pedido_herramienta i WHERE i.pedido_id = ph.id) as items
            FROM pedidos_herramientas ph
            LEFT JOIN operadores o ON ph.operador_id = o.id
            LEFT JOIN compradores c ON ph.comprador_id = c.id
            WHERE 1=1
        `;
        const params = [];
        let i = 1;

        if (operador_id) { query += ` AND ph.operador_id = $${i++}`; params.push(operador_id); }
        if (comprador_id) { query += ` AND ph.comprador_id = $${i++}`; params.push(comprador_id); }
        if (estado) { query += ` AND ph.estado = $${i++}`; params.push(estado); }

        query += ' ORDER BY ph.created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener pedidos:', err);
        res.status(500).json({ error: 'Error al obtener pedidos' });
    }
});

// GET - Pedido por ID
router.get('/:id', async (req, res) => {
    try {
        const pedido = await pool.query(
            `SELECT ph.*, o.nombre as operador_nombre, c.nombre as comprador_nombre
             FROM pedidos_herramientas ph
             LEFT JOIN operadores o ON ph.operador_id = o.id
             LEFT JOIN compradores c ON ph.comprador_id = c.id
             WHERE ph.id = $1`,
            [req.params.id]
        );
        if (pedido.rows.length === 0) return res.status(404).json({ error: 'Pedido no encontrado' });

        const items = await pool.query(
            'SELECT * FROM items_pedido_herramienta WHERE pedido_id = $1 ORDER BY id ASC',
            [req.params.id]
        );

        res.json({ ...pedido.rows[0], items: items.rows });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener pedido' });
    }
});

// POST - Crear nuevo pedido con items (descuenta stock automáticamente)
router.post('/', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { operador_id, comprador_id, notas, items } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Debe agregar al menos un item al pedido' });
        }

        // ── 1. Verificar y descontar stock (dentro de la transacción) ──
        for (const item of items) {
            const stockRes = await client.query(
                `SELECT cantidad FROM stock_herramientas
                 WHERE tipo = $1 AND marca = $2
                 FOR UPDATE`,                      // bloquea la fila
                [item.tipo, item.marca]
            );

            const stockActual = stockRes.rows[0]?.cantidad ?? 0;
            if (stockActual < item.cantidad) {
                await client.query('ROLLBACK');
                return res.status(409).json({
                    error: `Stock insuficiente: ${item.tipo} ${item.marca}`,
                    disponible: stockActual,
                    solicitado: item.cantidad
                });
            }

            await client.query(
                `UPDATE stock_herramientas
                 SET cantidad = cantidad - $3, updated_at = NOW()
                 WHERE tipo = $1 AND marca = $2`,
                [item.tipo, item.marca, item.cantidad]
            );
        }

        // ── 2. Calcular mano de obra ──────────────────────────────────
        let totalManoObra = 0;
        const itemsConManoObra = items.map(item => {
            const mo = calcularManoObra(item.tipo, item.marca, item.cantidad);
            totalManoObra += mo;
            return { ...item, mano_obra: mo };
        });

        // ── 3. Insertar pedido ────────────────────────────────────────
        const pedidoResult = await client.query(
            `INSERT INTO pedidos_herramientas (operador_id, comprador_id, notas, total_mano_obra, estado)
             VALUES ($1, $2, $3, $4, 'pendiente') RETURNING *`,
            [operador_id, comprador_id, notas, totalManoObra]
        );
        const pedido = pedidoResult.rows[0];

        // ── 4. Insertar items ─────────────────────────────────────────
        for (const item of itemsConManoObra) {
            await client.query(
                `INSERT INTO items_pedido_herramienta (pedido_id, tipo, marca, cantidad, mano_obra)
                 VALUES ($1, $2, $3, $4, $5)`,
                [pedido.id, item.tipo, item.marca, item.cantidad, item.mano_obra]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ ...pedido, items: itemsConManoObra });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al crear pedido:', err);
        res.status(500).json({ error: 'Error al crear pedido' });
    } finally {
        client.release();
    }
});

// PATCH - Actualizar estado del pedido
router.patch('/:id/estado', async (req, res) => {
    try {
        const { estado } = req.body;
        const validStates = ['pendiente', 'en_proceso', 'completado', 'cancelado'];
        if (!validStates.includes(estado)) {
            return res.status(400).json({ error: 'Estado inválido' });
        }

        const result = await pool.query(
            'UPDATE pedidos_herramientas SET estado = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [estado, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Pedido no encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar estado' });
    }
});

// DELETE - Eliminar pedido
router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM pedidos_herramientas WHERE id = $1 RETURNING id',
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
        res.json({ message: 'Pedido eliminado' });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar' });
    }
});

// GET - Tarifas de mano de obra
router.get('/config/tarifas', (req, res) => {
    res.json(TARIFAS_MANO_OBRA);
});

module.exports = router;
