const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET — Listar facturas de un comprador para un distribuidor
// ?comprador_id=X&distribuidor_id=Y
router.get('/', async (req, res) => {
    try {
        const { comprador_id, distribuidor_id } = req.query;
        if (!comprador_id) return res.status(400).json({ error: 'comprador_id requerido' });

        let query = `
            SELECT f.*,
                d.nombre AS distribuidor_nombre,
                COALESCE(SUM(a.monto), 0) AS total_abonado,
                f.monto_total - COALESCE(SUM(a.monto), 0) AS saldo_pendiente,
                (CURRENT_DATE - f.fecha_vencim)::int AS dias_vencido
            FROM facturas_comprador f
            JOIN distribuidores d ON d.id = f.distribuidor_id
            LEFT JOIN abonos_factura a ON a.factura_id = f.id
            WHERE f.comprador_id = $1
        `;
        const params = [comprador_id];
        if (distribuidor_id) {
            query += ' AND f.distribuidor_id = $2';
            params.push(distribuidor_id);
        }
        query += ' GROUP BY f.id, d.nombre ORDER BY f.fecha_vencim ASC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener facturas:', err);
        res.status(500).json({ error: 'Error al obtener facturas' });
    }
});

// GET /:id — Obtener factura por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT f.*,
                d.nombre AS distribuidor_nombre,
                COALESCE(SUM(a.monto), 0) AS total_abonado,
                f.monto_total - COALESCE(SUM(a.monto), 0) AS saldo_pendiente
            FROM facturas_comprador f
            JOIN distribuidores d ON d.id = f.distribuidor_id
            LEFT JOIN abonos_factura a ON a.factura_id = f.id
            WHERE f.id = $1
            GROUP BY f.id, d.nombre
        `, [id]);

        if (result.rows.length === 0) return res.status(404).json({ error: 'Factura no encontrada' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al obtener factura:', err);
        res.status(500).json({ error: 'Error al obtener factura' });
    }
});

// POST — Crear factura
router.post('/', async (req, res) => {
    try {
        const { comprador_id, distribuidor_id, numero, fecha_emision, fecha_vencim, monto_total, banco, num_letra, notas } = req.body;
        if (!comprador_id || !distribuidor_id || !numero || !fecha_emision || !fecha_vencim || !monto_total) {
            return res.status(400).json({ error: 'Campos obligatorios: comprador_id, distribuidor_id, numero, fecha_emision, fecha_vencim, monto_total' });
        }
        const result = await pool.query(`
            INSERT INTO facturas_comprador (comprador_id, distribuidor_id, numero, fecha_emision, fecha_vencim, monto_total, banco, num_letra, notas)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
        `, [comprador_id, distribuidor_id, numero, fecha_emision, fecha_vencim, monto_total, banco || null, num_letra || null, notas || null]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error al crear factura:', err);
        res.status(500).json({ error: 'Error al crear factura' });
    }
});

// PUT /:id — Editar factura
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { numero, fecha_emision, fecha_vencim, monto_total, banco, num_letra, notas } = req.body;
        const result = await pool.query(`
            UPDATE facturas_comprador
            SET numero=$1, fecha_emision=$2, fecha_vencim=$3, monto_total=$4, banco=$5, num_letra=$6, notas=$7
            WHERE id=$8 RETURNING *
        `, [numero, fecha_emision, fecha_vencim, monto_total, banco, num_letra, notas, id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Factura no encontrada' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al actualizar factura:', err);
        res.status(500).json({ error: 'Error al actualizar factura' });
    }
});

// DELETE /:id — Eliminar factura
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM facturas_comprador WHERE id=$1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Factura no encontrada' });
        res.json({ message: 'Factura eliminada', factura: result.rows[0] });
    } catch (err) {
        console.error('Error al eliminar factura:', err);
        res.status(500).json({ error: 'Error al eliminar factura' });
    }
});

// POST /:id/abonos — Registrar abono a una factura
router.post('/:id/abonos', async (req, res) => {
    try {
        const { id } = req.params;
        const { monto, descripcion, fecha } = req.body;
        if (!monto || monto <= 0) return res.status(400).json({ error: 'Monto debe ser mayor a 0' });

        // Verificar que la factura existe y que el abono no excede el saldo
        const factura = await pool.query(`
            SELECT f.monto_total, COALESCE(SUM(a.monto),0) AS total_abonado
            FROM facturas_comprador f
            LEFT JOIN abonos_factura a ON a.factura_id = f.id
            WHERE f.id = $1
            GROUP BY f.id
        `, [id]);
        if (factura.rows.length === 0) return res.status(404).json({ error: 'Factura no encontrada' });

        const saldo = factura.rows[0].monto_total - factura.rows[0].total_abonado;
        const montoReal = Math.min(parseFloat(monto), parseFloat(saldo));
        if (montoReal <= 0) return res.status(400).json({ error: 'La factura ya está completamente pagada' });

        const result = await pool.query(`
            INSERT INTO abonos_factura (factura_id, monto, descripcion, fecha)
            VALUES ($1,$2,$3,$4) RETURNING *
        `, [id, montoReal, descripcion || 'Abono registrado', fecha || new Date().toISOString().split('T')[0]]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error al registrar abono:', err);
        res.status(500).json({ error: 'Error al registrar abono' });
    }
});

// GET /:id/abonos — Historial de abonos de una factura
router.get('/:id/abonos', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM abonos_factura WHERE factura_id = $1 ORDER BY fecha DESC, creado_en DESC',
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener abonos:', err);
        res.status(500).json({ error: 'Error al obtener abonos' });
    }
});

module.exports = router;
