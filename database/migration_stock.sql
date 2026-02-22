-- ====================================================
-- MIGRACIÓN: Stock de Herramientas (solo por TIPO)
-- Ejecutar en Neon → panel SQL → pegar y ejecutar
-- ====================================================

-- Si ya existe la tabla con la estructura vieja, eliminarla primero:
DROP TABLE IF EXISTS stock_herramientas;

-- Tabla nueva: stock por tipo solamente (sin marca)
CREATE TABLE IF NOT EXISTS stock_herramientas (
    id            SERIAL PRIMARY KEY,
    tipo          VARCHAR(50)  NOT NULL UNIQUE,  -- 'Pico' | 'Zapapico'
    cantidad      INTEGER      NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
    minimo_alerta INTEGER      NOT NULL DEFAULT 100,
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Registros iniciales (cantidad 0, operador agrega su inventario real)
INSERT INTO stock_herramientas (tipo, cantidad, minimo_alerta)
VALUES
    ('Pico',     0, 100),
    ('Zapapico', 0, 100)
ON CONFLICT (tipo) DO NOTHING;
