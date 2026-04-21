const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// POST - Login de operador
router.post('/login', async (req, res) => {
    try {
        const { usuario, password } = req.body;

        if (!usuario || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
        }

        const result = await pool.query(
            'SELECT * FROM operadores WHERE usuario = $1 AND password_hash = $2 AND activo = TRUE',
            [usuario, password]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales de operador incorrectas' });
        }

        const operador = result.rows[0];
        delete operador.password_hash;

        res.json({ ...operador, rol: 'operador' });
    } catch (err) {
        console.error('Error en login de operador:', err);
        res.status(500).json({ error: 'Error en login' });
    }
});

// GET - Obtener todos los operadores
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, nombre, usuario, email, activo, created_at FROM operadores ORDER BY nombre ASC'
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener operadores' });
    }
});

// GET - Estadísticas avanzadas del operador
router.get('/:id/stats', async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Historial de las últimas 5 tandas con su producción real (sumada de pedidos)
        const tandasResult = await pool.query(`
            SELECT t.id, t.nombre, t.fecha_inicio,
                   COALESCE((SELECT SUM(i.cantidad) 
                    FROM items_pedido_herramienta i 
                    JOIN pedidos_herramientas p ON i.pedido_id = p.id 
                    WHERE p.tanda_id = t.id AND i.tipo = 'Pico'), 0) as picos,
                   COALESCE((SELECT SUM(i.cantidad) 
                    FROM items_pedido_herramienta i 
                    JOIN pedidos_herramientas p ON i.pedido_id = p.id 
                    WHERE p.tanda_id = t.id AND i.tipo = 'Zapapico'), 0) as zapapicos
            FROM tandas t
            WHERE t.operador_id = $1
            ORDER BY t.created_at DESC
            LIMIT 5
        `, [id]);

        // 2. Eficiencia de pedidos en la tanda activa
        const eficienciaResult = await pool.query(`
            SELECT estado, COUNT(*) as cantidad
            FROM pedidos_herramientas
            WHERE tanda_id = (SELECT id FROM tandas WHERE operador_id = $1 AND estado = 'activa' LIMIT 1)
            GROUP BY estado
        `, [id]);

        res.json({
            historial_tandas: tandasResult.rows.reverse(), // Orden cronológico para el gráfico
            eficiencia_pedidos: eficienciaResult.rows
        });
    } catch (err) {
        console.error('Error al obtener estadísticas del operador:', err);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

// GET - Operador por ID
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, nombre, usuario, email, activo FROM operadores WHERE id = $1',
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener operador' });
    }
});

module.exports = router;

