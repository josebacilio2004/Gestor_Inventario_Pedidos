const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// ── GET /pedidos/:id/stock-detalle  Ver desglose de un pedido ─────────────
router.get('/:id/stock-detalle', async (req, res) => {
    try {
        const { id } = req.params;

        const pedido = await pool.query('SELECT id, cantidad FROM pedidos WHERE id = $1', [id]);
        if (!pedido.rows.length)
            return res.status(404).json({ error: 'Pedido no encontrado' });

        const detalle = await pool.query(
            'SELECT * FROM pedido_stock_detalle WHERE pedido_id = $1 ORDER BY tipo',
            [id]
        );

        res.json({
            pedido_id: parseInt(id),
            cantidad_total: pedido.rows[0].cantidad,
            items: detalle.rows
        });
    } catch (err) {
        console.error('Error al obtener stock detalle:', err);
        res.status(500).json({ error: 'Error al obtener detalle de stock', detail: err.message });
    }
});

// ── POST /pedidos/:id/stock-detalle  Guardar desglose (inversionista) ──────
// Body: { items: [{ tipo: 'Pico'|'Zapapico', cantidad: N }] }
router.post('/:id/stock-detalle', async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { items } = req.body;

        if (!Array.isArray(items) || items.length === 0)
            return res.status(400).json({ error: 'Se requiere al menos un item de herramienta' });

        // Validar tipos
        const tiposValidos = ['Pico', 'Zapapico'];
        for (const item of items) {
            if (!tiposValidos.includes(item.tipo))
                return res.status(400).json({ error: `Tipo inválido: ${item.tipo}. Válidos: Pico, Zapapico` });
            if (!item.cantidad || item.cantidad <= 0)
                return res.status(400).json({ error: `Cantidad debe ser > 0 para ${item.tipo}` });
        }

        // Verificar que el pedido existe y obtener cantidad total
        const pedido = await pool.query('SELECT id, cantidad FROM pedidos WHERE id = $1', [id]);
        if (!pedido.rows.length)
            return res.status(404).json({ error: 'Pedido no encontrado' });

        const cantidadTotal = parseInt(pedido.rows[0].cantidad);
        const totalItems = items.reduce((sum, i) => sum + parseInt(i.cantidad), 0);
        if (totalItems > cantidadTotal)
            return res.status(400).json({
                error: `El total de herramientas (${totalItems}) no puede superar la cantidad del pedido (${cantidadTotal})`
            });

        await client.query('BEGIN');

        // Eliminar detalles previos no asignados si ya existían
        await client.query(
            'DELETE FROM pedido_stock_detalle WHERE pedido_id = $1 AND asignado = FALSE',
            [id]
        );

        // Insertar nuevos items
        const inserted = [];
        for (const item of items) {
            const r = await client.query(
                `INSERT INTO pedido_stock_detalle (pedido_id, tipo, cantidad)
                 VALUES ($1, $2, $3) RETURNING *`,
                [id, item.tipo, parseInt(item.cantidad)]
            );
            inserted.push(r.rows[0]);
        }

        await client.query('COMMIT');
        res.status(201).json({ pedido_id: parseInt(id), items: inserted });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al guardar stock detalle:', err);
        res.status(500).json({ error: 'Error al guardar detalle de stock', detail: err.message });
    } finally {
        client.release();
    }
});

// ── POST /pedidos/:id/asignar-stock  Operador confirma y asigna a tanda ────
// Body: { items: [{ tipo: 'Pico'|'Zapapico', marca: 'Tramontina'|'Bellota' }] }
router.post('/:id/asignar-stock', async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { items } = req.body;

        if (!Array.isArray(items) || items.length === 0)
            return res.status(400).json({ error: 'Se requiere especificar tipo y marca para cada herramienta' });

        const marcasValidas = ['Tramontina', 'Bellota'];
        const tiposValidos = ['Pico', 'Zapapico'];
        for (const item of items) {
            if (!tiposValidos.includes(item.tipo))
                return res.status(400).json({ error: `Tipo inválido: ${item.tipo}` });
            if (!marcasValidas.includes(item.marca))
                return res.status(400).json({ error: `Marca inválida: ${item.marca}. Válidas: Tramontina, Bellota` });
        }

        // Obtener tanda activa
        const tandaRes = await client.query("SELECT id FROM tandas WHERE estado = 'activa' LIMIT 1");
        if (!tandaRes.rows.length)
            return res.status(409).json({ error: 'No hay ninguna tanda activa. Crea una tanda primero.' });
        const tandaId = tandaRes.rows[0].id;

        // Verificar que el pedido tiene detalles sin asignar
        const detalles = await client.query(
            'SELECT * FROM pedido_stock_detalle WHERE pedido_id = $1 AND asignado = FALSE',
            [id]
        );
        if (!detalles.rows.length)
            return res.status(409).json({ error: 'Este pedido no tiene stock pendiente de asignar o ya fue asignado.' });

        // Validar que todas las piezas en el pedido tengan una entrada en el body (por tipo)
        for (const detalle of detalles.rows) {
            const config = items.find(i => i.tipo.toLowerCase() === detalle.tipo.toLowerCase());
            if (!config) {
                console.warn(`VALIDACIÓN FALLIDA: No hay configuración para tipo ${detalle.tipo} en pedido ${id}`);
                return res.status(400).json({
                    error: `Configuración incompleta: Falta el tipo ${detalle.tipo} en la petición`
                });
            }
        }

        await client.query('BEGIN');
        console.log(`INICIANDO TRANSACCIÓN: Asignando stock GENÉRICO para pedido ${id} a tanda ${tandaId}`);

        // Por cada tipo de herramienta en el pedido, sumar al stock genérico
        for (const detalle of detalles.rows) {
            const tipoStock = detalle.tipo; // e.g. "Pico"

            console.log(`PROCESANDO: ${detalle.cantidad} unidades de ${tipoStock} (Generico)`);

            // Sumar al stock_herramientas de la tanda activa (donde el tipo es genérico)
            const stockUpd = await client.query(
                `UPDATE stock_herramientas
                 SET cantidad = cantidad + $3, updated_at = NOW()
                 WHERE tanda_id = $1 AND tipo = $2
                 RETURNING *`,
                [tandaId, tipoStock, detalle.cantidad]
            );

            if (!stockUpd.rows.length) {
                // Si no existe la fila genérica, crearla
                await client.query(
                    `INSERT INTO stock_herramientas (tanda_id, tipo, cantidad)
                     VALUES ($1, $2, $3)`,
                    [tandaId, tipoStock, detalle.cantidad]
                );
            }

            // Marcar detalle como asignado
            await client.query(
                `UPDATE pedido_stock_detalle
                 SET asignado = TRUE, tanda_id = $1, marca_asignada = NULL
                 WHERE id = $2`,
                [tandaId, detalle.id]
            );
        }

        await client.query('COMMIT');
        res.json({
            message: `✅ Stock asignado a tanda activa (ID:${tandaId}) exitosamente`,
            pedido_id: parseInt(id),
            tanda_id: tandaId
        });
    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('CRITICAL: Error al asignar stock:', err);
        res.status(500).json({
            error: 'Error interno al asignar stock',
            detail: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    } finally {
        if (client) client.release();
    }
});

// ── GET /pedidos/stock-pendiente  Pedidos con stock sin asignar (para el operador)
router.get('/stock-pendiente', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                p.id AS pedido_id,
                p.fecha_pedido,
                p.cantidad AS cantidad_total,
                prod_main.nombre AS producto_nombre, -- Usar el alias que el frontend espera
                i.nombre AS inversionista_nombre,
                json_agg(
                    json_build_object(
                        'id', psd.id,
                        'tipo', psd.tipo,
                        'cantidad', psd.cantidad,
                        'producto_id', psd.producto_id,
                        'producto_nombre_especifico', pr.nombre
                    ) ORDER BY psd.id
                ) AS herramientas
            FROM pedido_stock_detalle psd
            JOIN pedidos p ON psd.pedido_id = p.id
            LEFT JOIN productos prod_main ON p.producto_id = prod_main.id
            LEFT JOIN inversionistas i ON p.inversionista_id = i.id
            LEFT JOIN productos pr ON psd.producto_id = pr.id
            WHERE psd.asignado = FALSE
            GROUP BY p.id, p.fecha_pedido, p.cantidad, prod_main.nombre, i.nombre
            ORDER BY p.id DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener stock pendiente:', err);
        res.status(500).json({ error: 'Error al obtener stock pendiente', detail: err.message });
    }
});

module.exports = router;
