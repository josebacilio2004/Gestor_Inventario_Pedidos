-- MIGRACIÓN: Mejorar integridad de pedido_stock_detalle
-- Ejecutar en el Editor SQL de Neon

-- 1. Añadir columna producto_id para evitar joins "borrosos" por nombre
ALTER TABLE pedido_stock_detalle ADD COLUMN IF NOT EXISTS producto_id INTEGER REFERENCES productos(id);

-- 2. Añadir marca_asignada si no existe (ya debería existir pero por seguridad)
ALTER TABLE pedido_stock_detalle ADD COLUMN IF NOT EXISTS marca_asignada VARCHAR(50);

-- 3. Limpiar datos antiguos para evitar duplicados en la vista (Opcional, pero recomendado)
-- DELETE FROM pedido_stock_detalle WHERE producto_id IS NULL;
