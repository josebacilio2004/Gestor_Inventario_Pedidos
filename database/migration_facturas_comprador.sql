-- ====================================================================
-- MIGRACIÓN: Módulo de Facturación del Comprador
-- Tablas: facturas_comprador, abonos_factura
-- Ejecutar en Neon → panel SQL
-- ⚠️  SAFE: usa IF NOT EXISTS — no destruye datos existentes
-- ====================================================================

-- ── 1. TABLA: facturas_comprador ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS facturas_comprador (
    id              SERIAL PRIMARY KEY,
    comprador_id    INT          NOT NULL REFERENCES compradores(id) ON DELETE CASCADE,
    distribuidor_id INT          NOT NULL REFERENCES distribuidores(id) ON DELETE RESTRICT,
    numero          VARCHAR(30)  NOT NULL,          -- ej: F002-0009505
    fecha_emision   DATE         NOT NULL,
    fecha_vencim    DATE         NOT NULL,
    monto_total     NUMERIC(12,2) NOT NULL CHECK (monto_total > 0),
    banco           VARCHAR(80),
    num_letra       VARCHAR(50),
    notas           TEXT,
    creado_en       TIMESTAMPTZ  DEFAULT NOW()
);

-- ── 2. TABLA: abonos_factura ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS abonos_factura (
    id          SERIAL PRIMARY KEY,
    factura_id  INT           NOT NULL REFERENCES facturas_comprador(id) ON DELETE CASCADE,
    fecha       DATE          NOT NULL DEFAULT CURRENT_DATE,
    monto       NUMERIC(12,2) NOT NULL CHECK (monto > 0),
    descripcion TEXT,
    creado_en   TIMESTAMPTZ   DEFAULT NOW()
);

-- ── 3. ÍNDICES para consultas frecuentes ─────────────────────────────
CREATE INDEX IF NOT EXISTS idx_fact_comp_comprador  ON facturas_comprador(comprador_id);
CREATE INDEX IF NOT EXISTS idx_fact_comp_distrib    ON facturas_comprador(distribuidor_id);
CREATE INDEX IF NOT EXISTS idx_abonos_factura_id    ON abonos_factura(factura_id);

-- ── 4. VISTA de resumen por factura ──────────────────────────────────
CREATE OR REPLACE VIEW vista_facturas_comprador AS
SELECT
    f.id,
    f.comprador_id,
    f.distribuidor_id,
    d.nombre                                   AS distribuidor_nombre,
    c.nombre                                   AS comprador_nombre,
    f.numero,
    f.fecha_emision,
    f.fecha_vencim,
    (CURRENT_DATE - f.fecha_vencim)::int       AS dias_vencido,   -- positivo = vencido
    f.monto_total,
    COALESCE(SUM(a.monto), 0)                  AS total_abonado,
    f.monto_total - COALESCE(SUM(a.monto), 0) AS saldo_pendiente,
    CASE
        WHEN COALESCE(SUM(a.monto), 0) >= f.monto_total THEN 'completada'
        WHEN COALESCE(SUM(a.monto), 0) > 0               THEN 'en_abono'
        WHEN CURRENT_DATE > f.fecha_vencim                THEN 'vencida'
        ELSE 'pendiente'
    END                                        AS estado,
    f.banco,
    f.num_letra,
    f.notas,
    f.creado_en
FROM facturas_comprador f
JOIN distribuidores d ON d.id = f.distribuidor_id
JOIN compradores    c ON c.id = f.comprador_id
LEFT JOIN abonos_factura a ON a.factura_id = f.id
GROUP BY f.id, d.nombre, c.nombre;

-- ── 5. DATOS DE PRUEBA (comentar si no se necesitan) ─────────────────
/*
-- Insertar facturas de prueba para el comprador con ID 1, distribuidor ID 1
INSERT INTO facturas_comprador (comprador_id, distribuidor_id, numero, fecha_emision, fecha_vencim, monto_total, banco, num_letra) VALUES
(1, 1, 'F002-0009505', '2026-01-21', '2026-02-05', 3360.36, 'BCP',        'LT-0001'),
(1, 1, 'F002-0009558', '2026-01-28', '2026-02-12', 4860.18, 'BBVA',       'LT-0002'),
(1, 1, 'F002-0009594', '2026-02-06', '2026-02-21', 4110.27, 'Interbank',  'LT-0003'),
(1, 1, 'F002-0009595', '2026-02-06', '2026-03-08', 2622.27, 'Scotiabank', 'LT-0004');
*/

-- ── FIN DE MIGRACIÓN ─────────────────────────────────────────────────
SELECT 'Migración facturas_comprador completada ✅' AS resultado;
