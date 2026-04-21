const express = require('express');
const router = express.Router();
const pool = require('../config/database');

async function ensureTableExists() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tanda_notas (
                id SERIAL PRIMARY KEY,
                tanda_id INTEGER REFERENCES tandas(id) ON DELETE CASCADE,
                contenido TEXT NOT NULL,
                color VARCHAR(20) DEFAULT '#fef3c7',
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ Tabla tanda_notas verificada/creada');
    } catch (err) { console.error('❌ Error al verificar tabla tanda_notas:', err); }
}
ensureTableExists();

// GET - Obtener todas las notas (para el dashboard general)
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tanda_notas ORDER BY created_at DESC LIMIT 20');
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener notas:', err);
        res.status(500).json({ error: 'Error al obtener notas' });
    }
});

// GET - Obtener notas de una tanda
router.get('/:tanda_id', async (req, res) => {
    try {
        const { tanda_id } = req.params;
        const result = await pool.query(
            'SELECT * FROM tanda_notas WHERE tanda_id = $1 ORDER BY created_at ASC',
            [tanda_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener notas:', err);
        res.status(500).json({ error: 'Error al obtener notas' });
    }
});

// POST - Agregar nota a una tanda
router.post('/', async (req, res) => {
    try {
        const { tanda_id, contenido, color } = req.body;
        if (!tanda_id || !contenido) {
            return res.status(400).json({ error: 'tanda_id y contenido son obligatorios' });
        }

        const result = await pool.query(
            'INSERT INTO tanda_notas (tanda_id, contenido, color) VALUES ($1, $2, $3) RETURNING *',
            [tanda_id, contenido, color || '#fef3c7']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error al crear nota:', err);
        res.status(500).json({ error: 'Error al crear nota' });
    }
});

// DELETE - Eliminar nota
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM tanda_notas WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Nota no encontrada' });
        }
        res.json({ message: 'Nota eliminada' });
    } catch (err) {
        console.error('Error al eliminar nota:', err);
        res.status(500).json({ error: 'Error al eliminar nota' });
    }
});

module.exports = router;
