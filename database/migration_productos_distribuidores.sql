-- ==============================================================================
-- MIGRACIÓN: Enlazar Productos con Distribuidores
-- Ejecutar en Neon SQL Editor
-- ==============================================================================

-- Añadimos la columna distribuidor_id a la tabla de productos con su constraint
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS distribuidor_id INT REFERENCES distribuidores(id);

-- Opcionalmente: un índice para búsquedas más rápidas por distribuidor
CREATE INDEX IF NOT EXISTS idx_productos_distribuidor_id ON productos(distribuidor_id);
