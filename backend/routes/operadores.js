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
