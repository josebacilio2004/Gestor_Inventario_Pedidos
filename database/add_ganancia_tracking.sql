-- Agregar columnas de ganancia devuelta
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS ganancia_devuelta DECIMAL(10,2) DEFAULT 0;

-- Actualizar ganancia pendiente como columna calculada
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='pedidos' AND column_name='ganancia_pendiente'
    ) THEN
        ALTER TABLE pedidos 
        ADD COLUMN ganancia_pendiente DECIMAL(10,2);
    END IF;
END $$;

-- Función para actualizar ganancia devuelta
CREATE OR REPLACE FUNCTION actualizar_ganancia_devuelta()
RETURNS TRIGGER AS '
BEGIN
    UPDATE pedidos 
    SET ganancia_devuelta = (
        SELECT COALESCE(SUM(monto), 0) 
        FROM pagos_ganancia
        WHERE pedido_id = NEW.pedido_id
    ),
    ganancia_pendiente = ganancia_real - COALESCE(ganancia_devuelta, 0)
    WHERE id = NEW.pedido_id;
    RETURN NEW;
END;
' LANGUAGE plpgsql;

-- Trigger para actualizar ganancia
DROP TRIGGER IF EXISTS trigger_actualizar_ganancia ON pagos_ganancia;
CREATE TRIGGER trigger_actualizar_ganancia
AFTER INSERT OR UPDATE OR DELETE ON pagos_ganancia
FOR EACH ROW EXECUTE FUNCTION actualizar_ganancia_devuelta();

-- Función para auto-actualizar estado
CREATE OR REPLACE FUNCTION auto_actualizar_estado()
RETURNS TRIGGER AS '
BEGIN
    IF COALESCE(NEW.capital_pendiente, 0) <= 0 AND COALESCE(NEW.ganancia_pendiente, 0) <= 0 THEN
        NEW.estado = ''completado'';
    ELSIF COALESCE(NEW.capital_pendiente, 0) > 0 OR COALESCE(NEW.ganancia_pendiente, 0) > 0 THEN
        NEW.estado = ''pendiente'';
    END IF;
    RETURN NEW;
END;
' LANGUAGE plpgsql;

-- Trigger para auto-estado
DROP TRIGGER IF EXISTS trigger_auto_estado ON pedidos;
CREATE TRIGGER trigger_auto_estado
BEFORE UPDATE ON pedidos
FOR EACH ROW EXECUTE FUNCTION auto_actualizar_estado();

-- Actualizar ganancia_pendiente en pedidos existentes
UPDATE pedidos
SET ganancia_pendiente = ganancia_real - COALESCE(ganancia_devuelta, 0);
