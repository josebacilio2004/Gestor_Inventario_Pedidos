# 🧪 Guía de Pruebas Locales - Sistema v2.0

## Pre-requisitos

✅ Backend corriendo: `npm start` en `c:\Bacilio\Gestor_Pagos_Inventario\backend`  
✅ Base de datos: Docker PostgreSQL activo  
✅ Frontend: Abrir archivos HTML directamente

---

## 🎯 Test 1: UI Corporativa (Azul Marino + Plateado)

### Aplicar Tema Corporativo

**1. Agregar CSS a todas las páginas HTML:**

Abre cada archivo y agrega después de `styles.css`:
```html
<link rel="stylesheet" href="css/corporate-theme.css">
```

**Archivos a modificar:**
- [ ] `frontend/index.html`
- [ ] `frontend/login.html`
- [ ] `frontend/dashboard-inversionista.html`
- [ ] `frontend/dashboard-comprador.html`
- [ ] `frontend/pages/pedidos.html`
- [ ] `frontend/pages/productos.html`
- [ ] `frontend/pages/distribuidores.html`

**2. Verificar colores:**

Abre: `file:///c:/Bacilio/Gestor_Pagos_Inventario/frontend/login.html`

**Deberías ver:**
- 🔵 Fondo azul marino oscuro (#1a3a52)
- 🪙 Botones con gradiente plateado
- ⚡ Acentos en azul brillante (#4a90e2)
- ✨ Efectos glassmorphism azulados

**Antes:** Púrpura/violeta  
**Después:** Azul marino + plateado ✅

---

## 🎯 Test 2: Login Multi-Rol

### Probar los 3 roles

**Abrir:** `file:///c:/Bacilio/Gestor_Pagos_Inventario/frontend/login.html`

#### Test 2.1: Admin
1. Click botón **👨‍💼 Administrador**
2. Usuario: `admin`
3. Contraseña: `admin123`
4. Click "Iniciar Sesión"

**Resultado esperado:**
- ✅ Redirige a `index.html`
- ✅ Navbar muestra: Productos | Distribuidores | Pedidos | Inversionistas | Compradores
- ✅ "Hola, Administrador del Sistema"

#### Test 2.2: Inversionista
1. Volver al login (o abrir en nueva pestaña)
2. Click **💰 Inversionista**
3. Usuario: `ssamira`
4. Contraseña: `demo123`
5. Iniciar sesión

**Resultado esperado:**
- ✅ Redirige a `dashboard-inversionista.html`
- ✅ Navbar: "Mi Dashboard" | "Mis Pedidos"
- ✅ "Hola, Ssamira"
- ✅ Estadísticas personales

#### Test 2.3: Comprador
1. Volver al login
2. Click **🛒 Comprador**
3. Usuario: `alicia`
4. Contraseña: `demo123`
5. Iniciar sesión

**Resultado esperado:**
- ✅ Redirige a `dashboard-comprador.html`
- ✅ Navbar: "Mi Dashboard" | "Mis Pedidos"
- ✅ "Hola, Alicia"
- ✅ Botones 💵 para registrar pagos

---

## 🎯 Test 3: Filtrado de Pedidos por Usuario

### Test 3.1: Admin ve TODO

1. Login como `admin` / `admin123`
2. Ir a "Pedidos"

**Resultado esperado:**
- ✅ Ve TODOS los pedidos del sistema
- ✅ Sin filtros aplicados
- ✅ Consola muestra: `Admin ve todos los pedidos: X`

### Test 3.2: Inversionista ve solo SUS pedidos

1. Login como `ssamira` / `demo123`
2. Ir a "Mis Pedidos"
3. Abrir consola (F12)

**Resultado esperado:**
- ✅ Solo pedidos donde `inversionista_id = 4` (Ssamira)
- ✅ Consola: `Filtrando pedidos para inversionista 4: X`
- ✅ No ve pedidos de otros inversionistas

### Test 3.3: Comprador ve solo SUS pedidos

1. Login como `alicia` / `demo123`
2. Ir a "Mis Pedidos"

**Resultado esperado:**
- ✅ Solo pedidos donde `comprador_id = 4` (Alicia)
- ✅ Consola: `Filtrando pedidos para comprador 4: X`
- ✅ No ve pedidos de otros compradores

---

## 🎯 Test 4: Checkbox Ganancia Devuelta (Persistente)

### Verificar que NO se desmarca

1. Login como `admin` o `alicia`
2. Ir a "Pedidos"
3. Localizar pedido con ganancia pendiente
4. **Click en checkbox ✓ Ganancia**

**Resultado esperado:**
- ✅ Checkbox se marca en verde
- ✅ Notificación: "✅ Ganancia marcada como devuelta"
- ✅ **NO se desmarca** después de 1 segundo
- ✅ Tooltip muestra fecha
- ✅ Animación suave al marcar

5. **Recargar página (F5)**

**Resultado esperado:**
- ✅ Checkbox SIGUE marcado ✅
- ✅ Estado persiste en base de datos

---

## 🎯 Test 5: Sistema de Pagos de Ganancia

### Test 5.1: Crear pedido de prueba

1. Login como `admin`
2. Ir a "Pedidos" → "Nuevo Pedido"
3. Completar:
   - Producto: Azuela Titan
   - Distribuidor: Cualquiera
   - **Inversionista**: Ssamira
   - **Comprador**: Alicia
   - Cantidad: 50
   - Capital invertido: S/ 2000
   - **Ganancia esperada**: S/ 800
   - **Ganancia real**: S/ 800
   - Estado: pendiente
4. Guardar

### Test 5.2: Registrar pago de ganancia (API)

**Usar Postman o curl:**

```powershell
# Registrar pago de S/ 300 en ganancia
Invoke-WebRequest -Uri http://localhost:3002/api/pagos-ganancia `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"pedido_id":3,"monto":300,"fecha_pago":"2026-01-07","notas":"Pago parcial 1/3"}'
```

**Resultado esperado:**
```json
{
  "id": 1,
  "pedido_id": 3,
  "monto": 300.00,
  "fecha_pago": "2026-01-07"
}
```

### Test 5.3: Verificar actualización automática

**Consultar pedido:**
```powershell
Invoke-WebRequest -Uri http://localhost:3002/api/pedidos/3
```

**Resultado esperado:**
```json
{
  "id": 3,
  "ganancia_real": 800.00,
  "ganancia_devuelta": 300.00,
  "ganancia_pendiente": 500.00,
  "estado": "pendiente"     ← Aún pendiente (porque queda ganancia)
}
```

### Test 5.4: Completar devolución

**Registrar segundo pago (completar S/ 800):**
```powershell
Invoke-WebRequest -Uri http://localhost:3002/api/pagos-ganancia `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"pedido_id":3,"monto":500,"fecha_pago":"2026-01-07","notas":"Pago final"}'
```

**Verificar estado automático:**
```powershell
Invoke-WebRequest -Uri http://localhost:3002/api/pedidos/3
```

**Resultado esperado:**
```json
{
  "ganancia_devuelta": 800.00,
  "ganancia_pendiente": 0.00,
  "capital_pendiente": 0.00,
  "estado": "completado"    ← Cambió automáticamente! ✅
}
```

---

## 🎯 Test 6: Dashboard Inversionista

### Ver estadísticas actualizadas

1. Login como `ssamira` / `demo123`
2. Dashboard muestra:

**Deberías ver:**
- ✅ Capital Total Invertido
- ✅ Capital Devuelto (verde)
- ✅ Capital Pendiente (amarillo)
- ✅ % Devolución
- ✅ **Ganancia Total Real**
- ✅ **Ganancia Devuelta** (nuevo! 💰)
- ✅ **Ganancia Pendiente** (nuevo! 💰)

---

## 🎯 Test 7: Navegación Fluida entre Vistas

### Test 7.1: Como Inversionista

1. Login como `ssamira`
2. Dashboard → Ver estadísticas
3. Ir a "Mis Pedidos"
4. **Click en logo Ss&M** (esquina superior)

**Resultado esperado:**
- ✅ Vuelve a `dashboard-inversionista.html` ✅
- ✅ No va a index.html
- ✅ Flujo coherente

### Test 7.2: Como Comprador

1. Login como `alicia`
2. Dashboard → Ver pedidos
3. Click "Mis Pedidos"
4. **Click en logo**

**Resultado esperado:**
- ✅ Vuelve a `dashboard-comprador.html` ✅
- ✅ Flujo coherente

### Test 7.3: Como Admin

1. Login como `admin`
2. Ir a cualquier vista (Productos, Pedidos, etc.)
3. **Click en logo**

**Resultado esperado:**
- ✅ Vuelve a `index.html` (dashboard general)

---

## 🎯 Test 8: Validación de Pagos de Ganancia

### Test 8.1: Error - Monto excede ganancia pendiente

```powershell
# Intentar pagar S/ 10,000 cuando solo hay S/ 500 pendiente
Invoke-WebRequest -Uri http://localhost:3002/api/pagos-ganancia `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"pedido_id":3,"monto":10000,"fecha_pago":"2026-01-07"}'
```

**Resultado esperado:**
```json
{
  "error": "El monto excede la ganancia pendiente (S/ 500.00)"
}
```
✅ Validación funciona!

### Test 8.2: Error - Pedido no existe

```powershell
Invoke-WebRequest -Uri http://localhost:3002/api/pagos-ganancia `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"pedido_id":999,"monto":100,"fecha_pago":"2026-01-07"}'
```

**Resultado esperado:**
```json
{
  "error": "Pedido no encontrado"
}
```
✅ Validación funciona!

---

## 📊 Checklist de Pruebas

### UI Corporativa
- [ ] Colores azul marino + plateado aplicados
- [ ] Gradientes corporativos visibles
- [ ] Efectos glassmorphism azulados
- [ ] `corporate-theme.css` linkeado en todas las páginas

### Login y Roles
- [ ] Admin login funciona → `index.html`
- [ ] Inversionista login → `dashboard-inversionista.html`
- [ ] Comprador login → `dashboard-comprador.html`
- [ ] Navbar cambia según userRole

### Filtrado de Pedidos
- [ ] Admin ve TODOS los pedidos
- [ ] Inversionista ve solo `inversionista_id = userId`
- [ ] Comprador ve solo `comprador_id = userId`
- [ ] Consola muestra logs de filtrado

### Checkbox Ganancia
- [ ] Click marca/desmarca
- [ ] Verde cuando checked
- [ ] NO se desmarca solo
- [ ] Persiste después de F5
- [ ] Tooltip muestra fecha

### Pagos de Ganancia
- [ ] POST `/api/pagos-ganancia` funciona
- [ ] `ganancia_devuelta` se actualiza
- [ ] `ganancia_pendiente` se calcula
- [ ] Estado cambia a "completado" automáticamente
- [ ] Validación de montos funciona

### Navegación
- [ ] Click en logo vuelve a TU dashboard
- [ ] Flujo coherente por rol
- [ ] Sin páginas huérfanas

---

## 🐛 Si Algo Falla

### Checkbox no persiste
- Verificar que `toggleGananciaDevuelta()` NO llama `loadPedidos()`
- Revisar consola para errores de API

### Filtrado no funciona
- Verificar `sessionStorage.userId` y `sessionStorage.userRole`
- Consola debe mostrar: `Filtrando pedidos para...`

### UI corporativa no se ve
- Verificar que `<link>` a `corporate-theme.css` esté DESPUÉS de `styles.css`
- Hard reload: Ctrl + Shift + R

### Estado no cambia automáticamente
- Triggers SQL pueden no estar activos
- Verificar manualmente con UPDATE en DB

---

**🎉 Con esto puedes evidenciar TODO localmente!** ✅
