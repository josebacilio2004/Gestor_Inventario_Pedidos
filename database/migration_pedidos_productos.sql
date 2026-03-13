-- MIGRACIÓN PARA PEDIDOS MULTI-PRODUCTO
-- Ejecutar en el Editor SQL de Neon

CREATE TABLE IF NOT EXISTS pedidos_productos (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(id),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexar para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_pedidos_productos_pedido ON pedidos_productos(pedido_id);

-- Opcional: Si quieres ver un mensaje de éxito
SELECT 'Tabla pedidos_productos creada exitosamente' as resultado;
