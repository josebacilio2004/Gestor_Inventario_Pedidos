-- Script de inicialización para Render PostgreSQL
-- Usuarios básicos para el sistema

-- 1. Insertar Admin (sin ON CONFLICT porque es nueva instalación)
INSERT INTO usuarios_admin (nombre, usuario, password_hash, email, activo)
VALUES ('Administrador del Sistema', 'admin', 'admin123', 'admin@ssm.com', true);

-- 2. Insertar Inversionista Ssamira
INSERT INTO inversionistas (nombre, contacto, telefono, email, usuario, password_hash, activo)
VALUES ('Ssamira Xiomara Checya Peña', 'Ssamira Checya', '987654321', 'ssamira@email.com', 'ssamira', 'demo123', true);

-- 3. Insertar Compradora Alicia
INSERT INTO compradores (nombre, contacto, telefono, email, usuario, password_hash, activo)
VALUES ('Alicia Peña Granilla', 'Alicia Peña', '912345678', 'alicia@email.com', 'alicia', 'demo123', true);

-- 4. Insertar algunos productos de ejemplo (opcional)
INSERT INTO productos (nombre, descripcion, precio_compra, precio_venta, stock_actual, stock_minimo, activo)
VALUES 
('Azuela Titan', 'Herramienta profesional', 100.00, 150.00, 50, 10, true),
('Martillo Profesional', 'Martillo de acero forjado', 80.00, 120.00, 30, 5, true),
('Desarmador Set', 'Set de 12 piezas', 50.00, 75.00, 40, 8, true);

-- 5. Insertar distribuidores de ejemplo (opcional)
INSERT INTO distribuidores (nombre, contacto, telefono, email, direccion, activo)
VALUES 
('Ferretería Central', 'Juan Pérez', '999888777', 'central@email.com', 'Av. Principal 123', true),
('Distribuidora Norte', 'María García', '988777666', 'norte@email.com', 'Jr. Comercio 456', true);

-- Verificar datos insertados
SELECT 'USUARIOS ADMIN' as tabla, COUNT(*) as registros FROM usuarios_admin
UNION ALL
SELECT 'INVERSIONISTAS', COUNT(*) FROM inversionistas
UNION ALL
SELECT 'COMPRADORES', COUNT(*) FROM compradores
UNION ALL
SELECT 'PRODUCTOS', COUNT(*) FROM productos
UNION ALL
SELECT 'DISTRIBUIDORES', COUNT(*) FROM distribuidores;
