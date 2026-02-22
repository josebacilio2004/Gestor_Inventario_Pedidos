-- ====================================================
-- MIGRACIÓN: Stock de Herramientas
-- Ejecutar en Neon (panel SQL)
-- ====================================================

-- Tabla de stock por tipo+marca de herramienta
CREATE TABLE IF NOT EXISTS stock_herramientas (
    id            SERIAL PRIMARY KEY,
    tipo          VARCHAR(50)  NOT NULL,  -- 'Pico' | 'Zapapico'
    marca         VARCHAR(50)  NOT NULL,  -- 'Tramontina' | 'Bellota'
    cantidad      INTEGER      NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
    minimo_alerta INTEGER      NOT NULL DEFAULT 50,
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (tipo, marca)
);

-- Stock inicial (ajustar según inventario real)
INSERT INTO stock_herramientas (tipo, marca, cantidad, minimo_alerta)
VALUES
    ('Pico',     'Tramontina', 0, 50),
    ('Pico',     'Bellota',    0, 50),
    ('Zapapico', 'Tramontina', 0, 50),
    ('Zapapico', 'Bellota',    0, 50)
ON CONFLICT (tipo, marca) DO NOTHING;

-- Función: descontar stock al insertar item confirmado
-- Se llama manualmente desde el backend (transacción POST /pedidos-herramientas)
-- No se usa trigger directo para mantener control en app layer.
