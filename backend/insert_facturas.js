require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        const compradorId = 1; // Alicia
        const distribuidorId = 1; // DAYLUM

        // 3. Insert Invoice 1
        // F002-0009594 06/02/2026 21/02/2026 S/ 4,110.27
        const q1 = `
            INSERT INTO facturas_comprador (comprador_id, distribuidor_id, numero, fecha_emision, fecha_vencim, monto_total, banco, num_letra, notas)
            VALUES ($1, $2, 'F002-0009594', '2026-02-06', '2026-02-21', 4110.27, 'Interbank', 'LT-0003', 'Factura real solicitada por el usuario')
            ON CONFLICT DO NOTHING RETURNING id;
        `;
        const r1 = await pool.query(q1, [compradorId, distribuidorId]);
        console.log(`Invoice 1 inserted. ID: ${r1.rows.length ? r1.rows[0].id : 'N/A'}`);

        // 4. Insert Invoice 2
        // F002-0009595 06/02/2026 08/03/2026 S/ 2,622.27
        const q2 = `
            INSERT INTO facturas_comprador (comprador_id, distribuidor_id, numero, fecha_emision, fecha_vencim, monto_total, banco, num_letra, notas)
            VALUES ($1, $2, 'F002-0009595', '2026-02-06', '2026-03-08', 2622.27, 'Scotiabank', 'LT-0004', 'Factura real solicitada por el usuario')
            ON CONFLICT DO NOTHING RETURNING id;
        `;
        const r2 = await pool.query(q2, [compradorId, distribuidorId]);
        console.log(`Invoice 2 inserted. ID: ${r2.rows.length ? r2.rows[0].id : 'N/A'}`);

        console.log("Success!");
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

main();
