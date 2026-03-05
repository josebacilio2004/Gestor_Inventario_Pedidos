const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// ── Tarifas mano de obra por unidad ───────────────────────────────
const TARIFAS_MANO_OBRA = {
    'Pico-Tramontina': { base: 1, tarifa: 0.43 },
    'Pico-Bellota': { base: 1, tarifa: 0.55 },
    'Zapapico-Tramontina': { base: 1, tarifa: 0.43 },
    'Zapapico-Bellota': { base: 1, tarifa: 0.55 },
};

function calcularManoObra(tipo, marca, cantidad) {
    const cfg = TARIFAS_MANO_OBRA[`${tipo}-${marca}`];
    if (!cfg) return 0;
    return parseFloat(((cantidad / cfg.base) * cfg.tarifa).toFixed(2));
}

// ── GET /   Listado de pedidos (filtrable por tanda, operador, estado) ─
router.get('/', async (req, res) => {
    try {
        const { operador_id, comprador_id, estado, tanda_id } = req.query;

        let query = `
            SELECT
                ph.id, ph.tanda_id, ph.estado, ph.notas, ph.total_mano_obra,
                ph.created_at, ph.updated_at,
                o.nombre AS operador_nombre,
                c.nombre AS comprador_nombre,
                ph.operador_id, ph.comprador_id,
                t.nombre  AS tanda_nombre,
                (SELECT json_agg(
                    json_build_object(
                        'id', i.id, 'tipo', i.tipo, 'marca', i.marca,
                        'cantidad', i.cantidad, 'mano_obra', i.mano_obra
                    )
                ) FROM items_pedido_herramienta i WHERE i.pedido_id = ph.id) AS items
            FROM pedidos_herramientas ph
            LEFT JOIN operadores o ON ph.operador_id = o.id
            LEFT JOIN compradores c ON ph.comprador_id = c.id
            LEFT JOIN tandas      t ON ph.tanda_id = t.id
            WHERE 1=1
        `;
        const params = [];
        let idx = 1;

        if (tanda_id) { query += ` AND ph.tanda_id     = $${idx++}`; params.push(tanda_id); }
        if (operador_id) { query += ` AND ph.operador_id  = $${idx++}`; params.push(operador_id); }
        if (comprador_id) { query += ` AND ph.comprador_id = $${idx++}`; params.push(comprador_id); }
        if (estado) { query += ` AND ph.estado       = $${idx++}`; params.push(estado); }

        query += ' ORDER BY ph.created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener pedidos:', err);
        res.status(500).json({ error: 'Error al obtener pedidos', detail: err.message });
    }
});

// ── GET /:id   Pedido por ID ──────────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                ph.*, o.nombre AS operador_nombre, c.nombre AS comprador_nombre,
                t.nombre AS tanda_nombre,
                COALESCE(
                    (SELECT json_agg(json_build_object(
                        'id', i.id, 'tipo', i.tipo, 'marca', i.marca,
                        'cantidad', i.cantidad, 'mano_obra', i.mano_obra
                    )) FROM items_pedido_herramienta i WHERE i.pedido_id = ph.id),
                    '[]'
                ) AS items
            FROM pedidos_herramientas ph
            LEFT JOIN operadores o ON ph.operador_id = o.id
            LEFT JOIN compradores c ON ph.comprador_id = c.id
            LEFT JOIN tandas      t ON ph.tanda_id = t.id
            WHERE ph.id = $1
        `, [req.params.id]);

        if (!result.rows.length) return res.status(404).json({ error: 'Pedido no encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener pedido', detail: err.message });
    }
});

// ── POST /   Crear pedido (automáticamente en la tanda activa) ────────
// Body: { operador_id, comprador_id, notas?, items: [{tipo, marca, cantidad}] }
router.post('/', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { operador_id, comprador_id, notas, items } = req.body;

        if (!items || items.length === 0)
            return res.status(400).json({ error: 'Debe agregar al menos un item al pedido' });

        // ── 1. Obtener tanda activa ───────────────────────────────────
        const tandaRes = await client.query("SELECT id, nombre FROM tandas WHERE estado = 'activa' LIMIT 1");
        if (!tandaRes.rows.length) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'No hay ninguna tanda activa. Crea una tanda antes de registrar pedidos.' });
        }
        const tanda = tandaRes.rows[0];

        // ── 2. Agrupar items por tipo y verificar/descontar stock ─────
        const totalPorTipo = {};
        for (const item of items) {
            totalPorTipo[item.tipo] = (totalPorTipo[item.tipo] || 0) + item.cantidad;
        }

        for (const [tipo, cantidadRequerida] of Object.entries(totalPorTipo)) {
            const stockRes = await client.query(
                `SELECT cantidad FROM stock_herramientas
                 WHERE tanda_id = $1 AND tipo = $2
                 FOR UPDATE`,
                [tanda.id, tipo]
            );

            const stockActual = stockRes.rows[0]?.cantidad ?? 0;
            if (stockActual < cantidadRequerida) {
                await client.query('ROLLBACK');
                return res.status(409).json({
                    error: `Stock insuficiente de ${tipo} en la tanda "${tanda.nombre}"`,
                    disponible: stockActual,
                    solicitado: cantidadRequerida
                });
            }

            await client.query(
                `UPDATE stock_herramientas
                 SET cantidad = cantidad - $3, updated_at = NOW()
                 WHERE tanda_id = $1 AND tipo = $2`,
                [tanda.id, tipo, cantidadRequerida]
            );
        }

        // ── 3. Calcular mano de obra total ────────────────────────────
        let totalManoObra = 0;
        const itemsConMO = items.map(item => {
            const mo = calcularManoObra(item.tipo, item.marca, item.cantidad);
            totalManoObra += mo;
            return { ...item, mano_obra: mo };
        });

        // ── 4. Insertar pedido ────────────────────────────────────────
        const pedidoRes = await client.query(`
            INSERT INTO pedidos_herramientas (tanda_id, operador_id, comprador_id, notas, total_mano_obra, estado)
            VALUES ($1, $2, $3, $4, $5, 'pendiente')
            RETURNING *
        `, [tanda.id, operador_id, comprador_id, notas || null, totalManoObra]);
        const pedido = pedidoRes.rows[0];

        // ── 5. Insertar items ─────────────────────────────────────────
        for (const item of itemsConMO) {
            await client.query(`
                INSERT INTO items_pedido_herramienta (pedido_id, tipo, marca, cantidad, mano_obra)
                VALUES ($1, $2, $3, $4, $5)
            `, [pedido.id, item.tipo, item.marca, item.cantidad, item.mano_obra]);
        }

        await client.query('COMMIT');
        res.status(201).json({ ...pedido, items: itemsConMO, tanda_nombre: tanda.nombre });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al crear pedido:', err);
        res.status(500).json({ error: 'Error al crear pedido', detail: err.message });
    } finally {
        client.release();
    }
});

// ── PATCH /:id/estado   Cambiar estado del pedido ─────────────────────
router.patch('/:id/estado', async (req, res) => {
    try {
        const { estado } = req.body;
        const estadosValidos = ['pendiente', 'en_proceso', 'completado', 'cancelado'];
        if (!estadosValidos.includes(estado))
            return res.status(400).json({ error: 'Estado inválido' });

        const result = await pool.query(`
            UPDATE pedidos_herramientas
            SET estado = $2, updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `, [req.params.id, estado]);

        if (!result.rows.length) return res.status(404).json({ error: 'Pedido no encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar estado', detail: err.message });
    }
});

// ── DELETE /:id   Eliminar pedido (solo si está pendiente) ────────────
router.delete('/:id', async (req, res) => {
    try {
        const check = await pool.query('SELECT estado FROM pedidos_herramientas WHERE id = $1', [req.params.id]);
        if (!check.rows.length) return res.status(404).json({ error: 'Pedido no encontrado' });
        if (check.rows[0].estado !== 'pendiente')
            return res.status(409).json({ error: 'Solo se pueden eliminar pedidos en estado pendiente' });

        await pool.query('DELETE FROM pedidos_herramientas WHERE id = $1', [req.params.id]);
        res.json({ message: 'Pedido eliminado' });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar pedido', detail: err.message });
    }
});

module.exports = router;
