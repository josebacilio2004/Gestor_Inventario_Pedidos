# ✅ Filtrado de Pedidos por Usuario - SOLUCIONADO

## Problema Identificado
- Alicia (compradora) veía TODOS los pedidos
- Ssamira (inversionista) veía TODOS los pedidos
- Necesitaban ver solo SUS pedidos asignados

## Solución Implementada

### Cambios en `pedidos.js`

**Antes:**
```javascript
async function loadPedidos() {
  pedidos = await fetchAPI('/pedidos'); // TODOS los pedidos
  renderPedidos();
}
```

**Después:**
```javascript
async function loadPedidos() {
  const userRole = sessionStorage.getItem('userRole');
  const userId = sessionStorage.getItem('userId');
  
  let allPedidos = await fetchAPI('/pedidos');
  
  // Filtrar según rol
  if (userRole === 'inversionista') {
    pedidos = allPedidos.filter(p => p.inversionista_id == userId);
  } else if (userRole === 'comprador') {
    pedidos = allPedidos.filter(p => p.comprador_id == userId);
  } else {
    pedidos = allPedidos; // Admin ve todos
  }
  
  renderPedidos();
}
```

## Ahora Funciona Así

### Como Alicia (Compradora)
1. Login: `alicia` / `demo123` (userId = 4)
2. Va a "Mis Pedidos"
3. **Solo ve pedidos donde `comprador_id = 4`** ✅
4. No ve pedidos de otros compradores

### Como Ssamira (Inversionista)
1. Login: `ssamira` / `demo123` (userId = 4)
2. Va a "Mis Pedidos"
3. **Solo ve pedidos donde `inversionista_id = 4`** ✅
4. No ve pedidos de otros inversionistas

### Como Admin
1. Login: `admin` / `admin123`
2. Va a "Pedidos"
3. **Ve TODOS los pedidos del sistema** ✅
4. Control total

## Cómo Asignar Pedidos

### Desde Admin o Comprador:
1. Ir a "Pedidos"
2. Click "Nuevo Pedido" o "✏️ Editar"
3. Seleccionar:
   - **Inversionista**: Quien provee el capital
   - **Comprador**: Quien gestiona la compra
4. Guardar

### El pedido aparecerá:
- En dashboard del **inversionista seleccionado**
- En dashboard del **comprador seleccionado**
- En pedidos del **admin** (siempre)

## Verificación

Para verificar que funciona:

1. **Crear pedido como admin:**
   - Inversionista: Ssamira (id=4)
   - Comprador: Alicia (id=4)

2. **Login como Ssamira:**
   - Dashboard → Ve el pedido
   - "Mis Pedidos" → Ve el pedido

3. **Login como Alicia:**
   - Dashboard → Ve el pedido
   - "Mis Pedidos" → Ve el pedido

4. **Crear otro pedido:**
   - Inversionista: Otro (id=5)
   - Comprador: Otro (id=1)

5. **Login como Ssamira nuevamente:**
   - **NO ve** el segundo pedido ✅
   - Solo ve el que tiene `inversionista_id=4`

6. **Login como Alicia nuevamente:**
   - **NO ve** el segundo pedido ✅
   - Solo ve el que tiene `comprador_id=4`

---

**✅ PROBLEMA RESUELTO: Cada usuario ve solo SUS pedidos asignados**
