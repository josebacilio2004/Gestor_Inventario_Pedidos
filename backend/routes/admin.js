const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET - Obtener todos los administradores
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, nombre, usuario, email, activo, created_at FROM usuarios_admin ORDER BY nombre ASC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener administradores:', err);
        res.status(500).json({ error: 'Error al obtener administradores' });
    }
});

// POST - Login de administrador
router.post('/login', async (req, res) => {
    try {
        const { usuario, password } = req.body;

        if (!usuario || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
        }

        const result = await pool.query(
            'SELECT * FROM usuarios_admin WHERE usuario = $1 AND password_hash = $2 AND activo = TRUE',
            [usuario, password]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const admin = result.rows[0];
        delete admin.password_hash; // No enviar el hash al frontend

        res.json(admin);
    } catch (err) {
        console.error('Error en login de administrador:', err);
        res.status(500).json({ error: 'Error en login' });
    }
});

// POST - Crear administrador
router.post('/', async (req, res) => {
    try {
        const { nombre, usuario, password_hash, email } = req.body;

        if (!nombre || !usuario || !password_hash) {
            return res.status(400).json({ error: 'Nombre, usuario y contraseña son requeridos' });
        }

        const result = await pool.query(
            `INSERT INTO usuarios_admin (nombre, usuario, password_hash, email, activo) 
             VALUES ($1, $2, $3, $4, TRUE) 
             RETURNING id, nombre, usuario, email, activo`,
            [nombre, usuario, password_hash, email]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error al crear administrador:', err);
        if (err.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'El usuario ya existe' });
        }
        res.status(500).json({ error: 'Error al crear administrador' });
    }
});

module.exports = router;
