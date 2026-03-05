const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// ============================================
// 1. CLIENTES MAYORISTAS
// ============================================

// GET - Obtener todos los clientes mayoristas
router.get('/clientes', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM clientes_mayoristas WHERE activo = true ORDER BY nombre ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener clientes mayoristas:', err);
        res.status(500).json({ error: 'Error al obtener clientes' });
    }
});

// POST - Crear un nuevo cliente mayorista
router.post('/clientes', async (req, res) => {
    try {
        const { nombre, documento, telefono, direccion } = req.body;
        if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' });

        const result = await pool.query(
            `INSERT INTO clientes_mayoristas (nombre, documento, telefono, direccion) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [nombre, documento, telefono, direccion]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error al crear cliente mayorista:', err);
        res.status(500).json({ error: 'Error al crear cliente' });
    }
});

// ============================================
// 2. STOCK DINÁMICO (CALCULADO EN TIEMPO REAL)
// ============================================

// GET - Obtener stock disponible actual (Terminados - Vendidos)
router.get('/stock', async (req, res) => {
    try {
        // Query de Productos Terminados (Producidos por el Operador, estado='completado')
        const producidosQuery = `
            SELECT i.tipo, i.marca, SUM(i.cantidad) as total_producido
            FROM items_pedido_herramienta i
            JOIN pedidos_herramientas p ON p.id = i.pedido_id
            WHERE p.estado = 'completado'
            GROUP BY i.tipo, i.marca
        `;

        // Query de Productos Vendidos (Por la Compradora)
        const vendidosQuery = `
            SELECT d.tipo, d.marca, SUM(d.cantidad) as total_vendido
            FROM detalles_venta_mayorista d
            JOIN ventas_mayoristas v ON v.id = d.venta_id
            WHERE v.estado = 'completada'
            GROUP BY d.tipo, d.marca
        `;

        // Query de Productos Ingresados Manualmente (Por la Compradora)
        const ingresadosQuery = `
            SELECT tipo, marca, SUM(cantidad) as total_ingresado
            FROM ingresos_stock_comprador
            GROUP BY tipo, marca
        `;

        const [producidosRes, vendidosRes, ingresadosRes] = await Promise.all([
            pool.query(producidosQuery),
            pool.query(vendidosQuery),
            pool.query(ingresadosQuery)
        ]);

        const producidos = producidosRes.rows;
        const vendidos = vendidosRes.rows;
        const ingresados = ingresadosRes.rows;

        // Estructura base de inventario predefinida
        const inventario = {
            'Pico-Tramontina': { tipo: 'Pico', marca: 'Tramontina', producido: 0, ingresado: 0, vendido: 0, disponible: 0 },
            'Pico-Bellota': { tipo: 'Pico', marca: 'Bellota', producido: 0, ingresado: 0, vendido: 0, disponible: 0 },
            'Zapapico-Tramontina': { tipo: 'Zapapico', marca: 'Tramontina', producido: 0, ingresado: 0, vendido: 0, disponible: 0 },
            'Zapapico-Bellota': { tipo: 'Zapapico', marca: 'Bellota', producido: 0, ingresado: 0, vendido: 0, disponible: 0 }
        };

        // Llenar producidos
        producidos.forEach(p => {
            const key = `${p.tipo}-${p.marca}`;
            if (inventario[key]) inventario[key].producido = parseInt(p.total_producido) || 0;
        });

        // Llenar ingresados manualmente
        ingresados.forEach(i => {
            const key = `${i.tipo}-${i.marca}`;
            if (inventario[key]) inventario[key].ingresado = parseInt(i.total_ingresado) || 0;
        });

        // Llenar vendidos
        vendidos.forEach(v => {
            const key = `${v.tipo}-${v.marca}`;
            if (inventario[key]) inventario[key].vendido = parseInt(v.total_vendido) || 0;
        });

        // Calcular disponibles
        Object.keys(inventario).forEach(key => {
            inventario[key].disponible = (inventario[key].producido + inventario[key].ingresado) - inventario[key].vendido;
        });

        res.json(Object.values(inventario));

    } catch (err) {
        console.error('Error al calcular stock mayorista:', err);
        res.status(500).json({ error: 'Error al calcular stock' });
    }
});

// ============================================
// 3. VENTAS MAYORISTAS
// ============================================

// GET - Listar todas las ventas (con detalles)
router.get('/ventas', async (req, res) => {
    try {
        const ventasRes = await pool.query(`
            SELECT v.*, c.nombre as cliente_nombre 
            FROM ventas_mayoristas v
            JOIN clientes_mayoristas c ON c.id = v.cliente_id
            ORDER BY v.fecha_venta DESC, v.created_at DESC
        `);

        // Para simplificar, obtenemos los detalles de todas las ventas
        const detallesRes = await pool.query('SELECT * FROM detalles_venta_mayorista');

        // Asociar detalles a cada venta
        const ventas = ventasRes.rows.map(venta => {
            venta.detalles = detallesRes.rows.filter(d => d.venta_id === venta.id);
            return venta;
        });

        res.json(ventas);
    } catch (err) {
        console.error('Error al listar ventas:', err);
        res.status(500).json({ error: 'Error al listar ventas' });
    }
});

// POST - Registrar nueva venta mayorista
router.post('/ventas', async (req, res) => {
    const client = await pool.connect();
    try {
        const { comprador_id, cliente_id, total, notas, detalles } = req.body;

        if (!comprador_id || !cliente_id || !detalles || detalles.length === 0) {
            return res.status(400).json({ error: 'Faltan datos obligatorios para registrar la venta' });
        }

        await client.query('BEGIN');

        // Insertar cabecera de la venta
        const ventaRes = await client.query(`
            INSERT INTO ventas_mayoristas (comprador_id, cliente_id, total, notas, estado)
            VALUES ($1, $2, $3, $4, 'completada') RETURNING *
        `, [comprador_id, cliente_id, total, notas || null]);

        const venta = ventaRes.rows[0];

        // Insertar detalles
        for (let item of detalles) {
            await client.query(`
                INSERT INTO detalles_venta_mayorista (venta_id, tipo, marca, cantidad, precio_unitario)
                VALUES ($1, $2, $3, $4, $5)
            `, [venta.id, item.tipo, item.marca, item.cantidad, item.precio_unitario]);
        }

        await client.query('COMMIT');

        res.status(201).json({ message: 'Venta registrada con éxito', venta_id: venta.id });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: 'Error al registrar venta' });
    } finally {
        client.release();
    }
});

// POST - Registrar stock manual ingresado por la compradora
router.post('/stock-manual', async (req, res) => {
    try {
        const { comprador_id, tipo, marca, cantidad, notas } = req.body;

        if (!comprador_id || !tipo || !marca || !cantidad || cantidad <= 0) {
            return res.status(400).json({ error: 'Datos incompletos o inválidos' });
        }

        const result = await pool.query(`
            INSERT INTO ingresos_stock_comprador (comprador_id, tipo, marca, cantidad, notas)
            VALUES ($1, $2, $3, $4, $5) RETURNING *
        `, [comprador_id, tipo, marca, cantidad, notas || null]);

        res.status(201).json({ message: 'Stock manual registrado con éxito', ingreso: result.rows[0] });
    } catch (err) {
        console.error('Error al registrar stock manual:', err);
        res.status(500).json({ error: 'Error interno al registrar stock manual' });
    }
});

module.exports = router;
