-- ==========================================================
-- SCRIPT PARA REINICIAR LA BASE DE DATOS MANTENIENDO 2 FACTURAS
-- ==========================================================
-- ADVERTENCIA: ESTO BORRARÁ TODOS LOS REGISTROS EXCEPTO LAS
-- 2 FACTURAS REALES Y SUS DEPENDENCIAS STRICTAS (COMPRADOR/DISTRIBUIDOR).
-- ==========================================================

-- 1. Vaciar completamente las tablas independientes o que no afectan a las facturas
TRUNCATE TABLE 
    usuarios_admin, 
    inversionistas, 
    productos, 
    pedidos, 
    pagos_capital, 
    pagos_ganancia, 
    abonos_factura, 
    tandas, 
    aportes_tanda, 
    pagos_tanda, 
    pedidos_herramientas, 
    inventario_herramientas,
    operadores,
    actividades_operador
RESTART IDENTITY CASCADE;

-- 2. Eliminar facturas exceptuando las 2 indicadas
DELETE FROM facturas_comprador 
WHERE numero NOT IN ('F002-0009594', 'F002-0009595');

-- 3. Eliminar compradores que no estén en las facturas que quedan
DELETE FROM compradores 
WHERE id NOT IN (SELECT comprador_id FROM facturas_comprador);

-- 4. Eliminar distribuidores que no estén en las facturas que quedan
DELETE FROM distribuidores 
WHERE id NOT IN (SELECT distribuidor_id FROM facturas_comprador);

-- 5. Insertar al Administrador por defecto nuevamente
INSERT INTO usuarios_admin (nombre, usuario, password_hash, email) 
VALUES (
    'Administrador', 
    'admin', 
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'admin@comercializadoraaly.com'
) ON CONFLICT (usuario) DO NOTHING;

SELECT 'Base de datos reiniciada, conservando las 2 facturas maestras.' as resultado;
