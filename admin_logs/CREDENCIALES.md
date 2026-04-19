# 🔐 Credenciales de Acceso al Sistema

## 📋 Usuarios Creados

El sistema incluye usuarios de demostración para Inversionistas y Compradores Principales con autenticación.

---

## 💰 Inversionistas

### Inversionista 1: Inversiones García SAC
- **Usuario**: `inversor1`
- **Contraseña**: `demo123`
- **Contacto**: Roberto García
- **Teléfono**: 999-111-222
- **Email**: r.garcia@inversiones.com

### Inversionista 2: Familia Rodríguez
- **Usuario**: `inversor2`
- **Contraseña**: `demo123`
- **Contacto**: Ana Rodríguez
- **Teléfono**: 999-333-444
- **Email**: ana.r@email.com

### Inversionista 3: Fondo Capital Plus
- **Usuario**: `inversor3`
- **Contraseña**: `demo123`
- **Contacto**: Jorge Lima
- **Teléfono**: 999-555-666
- **Email**: contacto@capitalplus.com

---

## 🛒 Compradores Principales

### Comprador 1: Pedro Sánchez
- **Usuario**: `comprador1`
- **Contraseña**: `demo123`
- **Teléfono**: 988-111-222
- **Email**: p.sanchez@email.com
- **Zona**: Norte

### Comprador 2: Luis Mendoza
- **Usuario**: `comprador2`
- **Contraseña**: `demo123`
- **Teléfono**: 988-333-444
- **Email**: l.mendoza@email.com
- **Zona**: Centro

### Comprador 3: Carmen Vega
- **Usuario**: `comprador3`
- **Contraseña**: `demo123`
- **Teléfono**: 988-555-666
- **Email**: c.vega@email.com
- **Zona**: Sur

---

## 🔄 Flujo del Sistema

### 1. Inversionista
- Aporta capital inicial
- Monitorea su inversión
- Recibe devolución progresiva del capital
- Recibe ganancia al finalizar

### 2. Comprador Principal
- Recibe capital del inversionista
- Compra productos al distribuidor
- Vende y genera ganancia
- Devuelve progresivamente el capital al inversionista
- Entrega ganancia al finalizar

### 3. Proceso
```
Inversionista → [Capital] → Comprador Principal
                                ↓
                    Compra a Distribuidor
                                ↓
                          Vende productos
                                ↓
                        Genera ganancia
                                ↓
        ←── Devuelve Capital (Progresivo) + Ganancia (Al final) ───
```

---

## 📊 Seguimiento de Capital

### En la Tabla de Pedidos
Cada pedido muestra:
- **Capital Invertido**: Monto total inicial
- **Capital Devuelto**: Lo que ya se ha regresado
- **Capital Pendiente**: Lo que aún falta devolver
- **Ganancia Devuelta**: ✅ (Si) o ⏳ (Pendiente)

### Sistema de Pagos Progresivos
- El comprador registra pagos parciales
- El sistema actualiza automáticamente el capital devuelto
- El capital pendiente se recalcula en tiempo real

---

## 🎯 Cómo Usar el Sistema

### Para Registrar un Nuevo Pedido:

1. Ir a **Pedidos** → **+ Nuevo Pedido**
2. Llenar:
   - Producto
   - Distribuidor
   - **Inversionista** (quien provee el capital)
   - **Comprador** (quien gestiona la compra)
   - Cantidad
   - Capital Invertido
   - Ganancia Esperada
3. Guardar

### Para Registrar Pagos de Capital:

1. Ir a **Pedidos**
2. Hacer click en el pedido
3. Click en **"Registrar Pago de Capital"**
4. Ingresar:
   - Monto del pago
   - Fecha
   - Tipo (capital/ganancia/mixto)
5. El sistema actualiza automáticamente el capital devuelto y pendiente

---

## ⚠️ Nota de Seguridad

> **IMPORTANTE**: En un entorno de producción, las contraseñas deben:
> - Estar hasheadas con bcrypt o similar
> - Tener requisitos mínimos de complejidad
> - Implementar recuperación de contraseña
> - Usar HTTPS para todas las comunicaciones
> 
> Las credenciales actuales (`demo123`) son **SOLO PARA DEMOSTRACIÓN**.

---

## 📱 Acceso Rápido

**Frontend**: `file:///c:/Bacilio/Gestor_Pagos_Inventario/frontend/index.html`

**API Backend**: `http://localhost:3002`

**Endpoints**:
- `/api/inversionistas` - Gestión de inversionistas
- `/api/compradores` - Gestión de compradores
- `/api/pedidos` - Pedidos con tracking de inversión
- `/api/pagos-capital` - Pagos progresivos
- `/api/productos` - Catálogo de productos
- `/api/distribuidores` - Proveedores

**Base de Datos** (DBeaver):
- Host: `localhost`
- Port: `5433`
- Database: `gestor_inventario`
- User: `postgres`
- Password: `postgres`

---

## ✅ Estado del Sistema

- ✅ Base de datos con autenticación
- ✅ 3 Inversionistas activos
- ✅ 3 Compradores activos
- ✅ Sistema de pagos progresivos
- ✅ Tracking automático de capital
- ✅ Frontend completo
- ✅ Backend con todas las APIs

**El sistema está listo para usar** 🚀
