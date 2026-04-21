# ✅ Credenciales de Login Activas

## 🔐 LOGIN FUNCIONANDO

El sistema de login ya está configurado correctamente. Puedes acceder desde:

**URL**: `file:///c:/Bacilio/Gestor_Pagos_Inventario/frontend/login.html`

---

## 👥 Usuarios Disponibles

### 💰 Inversionistas

| ID | Usuario | Contraseña | Nombre |
|----|---------|------------|--------|
| 5 | `inversor1` | `demo123` | Inversiones García SAC |
| 6 | `inversor2` | `demo123` | Familia Rodríguez |
| 7 | `inversor3` | `demo123` | Fondo Capital Plus |

### 🛒 Compradores Principales

| ID | Usuario | Contraseña | Nombre | Zona |
|----|---------|------------|--------|------|
| 1 | `comprador1` | `demo123` | Pedro Sánchez | Norte |
| 2 | `comprador2` | `demo123` | Luis Mendoza | Centro |
| 3 | `comprador3` | `demo123` | Carmen Vega | Sur |

---

## 🚀 Prueba el Login Ahora

### Opción 1: Como Inversionista

1. Abrir [login.html](file:///c:/Bacilio/Gestor_Pagos_Inventario/frontend/login.html)
2. Seleccionar rol: **Inversionista**
3. Usuario: `inversor1`
4. Contraseña: `demo123`
5. Click "Iniciar Sesión"
6. → Te lleva a tu dashboard con tus estadísticas

### Opción 2: Como Comprador

1. Abrir [login.html](file:///c:/Bacilio/Gestor_Pagos_Inventario/frontend/login.html)
2. Seleccionar rol: **Comprador**
3. Usuario: `comprador1`
4. Contraseña: `demo123`
5. Click "Iniciar Sesión"
6. → Te lleva a tu dashboard con botón para registrar pagos

---

## ⚠️ Nota

Si aún sale "Usuario o contraseña incorrectos", verifica que:
- El backend esté corriendo (`npm start` en carpeta `backend`)
- Docker esté corriendo (`docker ps` debe mostrar `gestor-inventario-db`)
- La consola del navegador (F12) no muestre errores de conexión

---

**¡El login ya debería funcionar correctamente!** ✅
