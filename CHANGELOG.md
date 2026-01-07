# 📝 CHANGELOG - Distribuidora Ss&M

## Versión 2.0 - Sistema Completo (2026-01-07)

### 🎉 Nuevas Funcionalidades

#### 1. Sistema de Pagos de Ganancia Progresivos
- ✅ **Tabla `pagos_ganancia`**: Registro de pagos parciales de ganancia
- ✅ **Columnas agregadas en `pedidos`**:
  - `ganancia_devuelta` - Monto total devuelto
  - `ganancia_pendiente` - Calculado automáticamente
- ✅ **API `/api/pagos-ganancia`**:
  - `GET ?pedido_id=X` - Listar pagos de un pedido
  - `POST` - Registrar nuevo pago con validación
  - `DELETE /:id` - Eliminar pago
- ✅ **Validación**: No permite montos mayores a ganancia pendiente

#### 2. Estado Automático de Pedidos
- Estado cambia automáticamente a "completado" cuando:
  - `capital_pendiente = 0` Y `ganancia_pendiente = 0`
- Se mantiene "pendiente" si hay algo por devolver

#### 3. UI Corporativa - Distribuidora Ss&M
- ✅ **Paleta de Colores**:
  - Azul Marino: #1a3a52 (primario)
  - Plateado: #c0c0c0 (secundario)
  - Azul Acento: #4a90e2
- ✅ **Archivo**: `frontend/css/corporate-theme.css`
- ✅ **Gradientes** corporativos azul/plateado
- ✅ **Efectos** glassmorphism con tonos azulados

#### 4. Navegación Dinámica por Roles
- ✅ **`frontend/js/navigation.js`**: Navbar cambia según userRole
- ✅ **Admin**: Ve TODO el sistema
- ✅ **Inversionista**: Solo SUS inversiones
- ✅ **Comprador**: Solo pedidos a su cargo

#### 5. Filtrado Automático de Pedidos
- ✅ Inversionistas ven solo `inversionista_id = userId`
- ✅ Compradores ven solo `comprador_id = userId`
- ✅ Admin ve todos sin filtro

### 🐛 Correcciones

#### 1. Login de Administrador
- ✅ Corregido: Ahora usa `POST /api/admin/login` correctamente
- ✅ Antes fallaba porque intentaba GET a `/api/compradores`

#### 2. Checkbox Ganancia Devuelta
- ✅ Ya no se desmarca después de click
- ✅ Removido reload innecesario en `toggleGananciaDevuelta()`
- ✅ Estilos mejorados con animación

#### 3. Credenciales de Usuario
- ✅ Alicia (compradora): `alicia` / `demo123`
- ✅ Ssamira (inversionista): `ssamira` / `demo123`
- ✅ Admin: `admin` / `admin123`
- ✅ API routes devuelven `password_hash` para autenticación

#### 4. PostgreSQL Connection Timeout
- ✅ Solución: Restart con `docker-compose down/up`
- ✅ Documentado en `SOLUCION_ERROR_CONEXION.md`

### 📁 Archivos Nuevos

**Backend:**
- `backend/routes/pagos-ganancia.js` - API pagos de ganancia
- `backend/routes/admin.js` - Autenticación admin

**Frontend:**
- `frontend/css/corporate-theme.css` - Tema corporativo
- `frontend/css/checkbox.css` - Estilos checkbox
- `frontend/js/navigation.js` - Navegación dinámica
- `frontend/dashboard-inversionista.html` - Dashboard inversores
- `frontend/dashboard-comprador.html` - Dashboard compradores

**Database:**
- `database/add_ganancia_tracking.sql` - Schema ganancia

**Documentación:**
- `GITHUB_PAGES_DEPLOYMENT.md` - Guía deployment
- `FILTRADO_PEDIDOS_SOLUCION.md` - Explicación filtrado
- `SOLUCION_ERROR_CONEXION.md` - Troubleshooting DB
- `CREDENCIALES_FINALES.md` - Lista de usuarios
- `CHANGELOG.md` - Este archivo

### 🔧 Archivos Modificados

**Backend:**
- `server.js` - Montadas rutas pagos-ganancia y admin
- `routes/inversionistas.js` - Query base table con password_hash
- `routes/compradores.js` - Query base table con password_hash

**Frontend:**
- `login.html` - Rol admin agregado, lógica corregida
- `js/pedidos.js` - Filtrado por rol, checkbox mejorado
- `pages/pedidos.html` - Columna ✓ Ganancia agregada

### 🗄️ Base de Datos

**Nuevas Tablas:**
```sql
usuarios_admin (id, nombre, usuario, password_hash, email, activo)
pagos_ganancia (id, pedido_id, monto, fecha_pago, notas)
```

**Columnas Agregadas:**
```sql
pedidos.ganancia_devuelta DECIMAL(10,2)
pedidos.ganancia_pendiente DECIMAL(10,2)
```

**Triggers:**
- `trigger_actualizar_ganancia` - Auto-suma pagos ganancia
- `trigger_auto_estado` - Auto-actualiza estado pedido

### 📊 Estadísticas

- **Líneas de código agregadas**: ~2,500
- **Archivos creados**: 15
- **Archivos modificados**: 10
- **Tablas nuevas**: 2
- **Endpoints API nuevos**: 3

---

## Versión 1.0 - Sistema Base (2026-01-05)

### Funcionalidades Iniciales
- Sistema de login con roles
- Gestión de productos, distribuidores, pedidos
- Pagos de capital progresivos
- Dashboards básicos
- Docker + PostgreSQL

---

**Distribuidora Ss&M - Sistema de Gestión Completo** 🚀
