-- ====================================================================
-- RESET COMPLETO: Sistema de Tandas + Stock + Pedidos Herramientas
-- Ejecutar en Neon → panel SQL
-- ⚠️  SOLO afecta las tablas del módulo operador (no toca pedidos,
--     productos, distribuidores, inversionistas, etc.)
-- ====================================================================

-- ── 1. ELIMINAR tablas del módulo operador (orden correcto) ──────────
DROP TABLE IF EXISTS items_pedido_herramienta CASCADE;
DROP TABLE IF EXISTS pedidos_herramientas       CASCADE;
DROP TABLE IF EXISTS stock_herramientas         CASCADE;
DROP TABLE IF EXISTS tandas                     CASCADE;

-- ── 2. TABLA: tandas ─────────────────────────────────────────────────
--   Una tanda = un lote de producción con su propio stock e inventario.
--   Sólo puede haber UNA tanda activa al mismo tiempo.
CREATE TABLE tandas (
    id            SERIAL       PRIMARY KEY,
    nombre        VARCHAR(100) NOT NULL,                    -- ej: "Tanda Marzo 2026"
    descripcion   TEXT,
    operador_id   INT          REFERENCES operadores(id),   -- quién la creó
    estado        VARCHAR(20)  NOT NULL DEFAULT 'activa'
                               CHECK (estado IN ('activa','cerrada','pausada')),
    fecha_inicio  DATE         NOT NULL DEFAULT CURRENT_DATE,
    fecha_cierre  DATE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── 3. TABLA: stock_herramientas ──────────────────────────────────────
--   El stock está vinculado a una tanda específica.
--   Cada tipo de herramienta tiene una fila por tanda.
CREATE TABLE stock_herramientas (
    id            SERIAL      PRIMARY KEY,
    tanda_id      INT         NOT NULL REFERENCES tandas(id) ON DELETE CASCADE,
    tipo          VARCHAR(50) NOT NULL CHECK (tipo IN ('Pico','Zapapico')),
    cantidad      INT         NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
    minimo_alerta INT         NOT NULL DEFAULT 100,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tanda_id, tipo)                                 -- 1 fila por tipo por tanda
);

-- ── 4. TABLA: pedidos_herramientas ────────────────────────────────────
--   Cada pedido pertenece a una tanda.
CREATE TABLE pedidos_herramientas (
    id              SERIAL      PRIMARY KEY,
    tanda_id        INT         NOT NULL REFERENCES tandas(id),
    operador_id     INT         REFERENCES operadores(id),
    comprador_id    INT         REFERENCES compradores(id),
    notas           TEXT,
    total_mano_obra NUMERIC(10,2) NOT NULL DEFAULT 0,
    estado          VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                                CHECK (estado IN ('pendiente','en_proceso','completado','cancelado')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. TABLA: items_pedido_herramienta ────────────────────────────────
--   Cada item tiene tipo + marca (la marca determina el costo MO).
--   El descuento de stock se hace a nivel de tipo (sin distinción de marca).
CREATE TABLE items_pedido_herramienta (
    id         SERIAL      PRIMARY KEY,
    pedido_id  INT         NOT NULL REFERENCES pedidos_herramientas(id) ON DELETE CASCADE,
    tipo       VARCHAR(50) NOT NULL,   -- 'Pico' | 'Zapapico'
    marca      VARCHAR(50) NOT NULL,   -- 'Tramontina' | 'Bellota'
    cantidad   INT         NOT NULL CHECK (cantidad > 0),
    mano_obra  NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- ── 6. ÍNDICES ────────────────────────────────────────────────────────
CREATE INDEX idx_pedidos_tanda    ON pedidos_herramientas(tanda_id);
CREATE INDEX idx_pedidos_operador ON pedidos_herramientas(operador_id);
CREATE INDEX idx_pedidos_estado   ON pedidos_herramientas(estado);
CREATE INDEX idx_stock_tanda      ON stock_herramientas(tanda_id);
CREATE INDEX idx_items_pedido     ON items_pedido_herramienta(pedido_id);

-- ── 7. FUNCIÓN: cierra cualquier tanda activa anterior al activar una nueva
CREATE OR REPLACE FUNCTION un_solo_activo()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado = 'activa' THEN
        UPDATE tandas
        SET estado = 'cerrada', fecha_cierre = CURRENT_DATE, updated_at = NOW()
        WHERE estado = 'activa' AND id <> NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tanda_un_solo_activo
AFTER INSERT OR UPDATE ON tandas
FOR EACH ROW EXECUTE FUNCTION un_solo_activo();

-- ── 8. VERIFICACIÓN ───────────────────────────────────────────────────
SELECT 'tandas'                   AS tabla, COUNT(*) AS filas FROM tandas
UNION ALL
SELECT 'stock_herramientas',       COUNT(*) FROM stock_herramientas
UNION ALL
SELECT 'pedidos_herramientas',     COUNT(*) FROM pedidos_herramientas
UNION ALL
SELECT 'items_pedido_herramienta', COUNT(*) FROM items_pedido_herramienta;

-- ✅ Listo. Crea una tanda desde el dashboard del operador para empezar.
