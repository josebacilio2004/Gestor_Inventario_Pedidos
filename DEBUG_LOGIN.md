# 🔐 Guía Rápida de Login

## ✅ Usuarios Confirmados en Base de Datos

He verificado la base de datos y estos son los usuarios activos:

### 💰 Inversionistas (Total: 4)

| ID | Usuario | Contraseña | Nombre |
|----|---------|------------|--------|
| 4 | `ssamira` | `demo123` | Ssamira Xiomara Checya Peña |
| 5 | `inversor1` | `demo123` | Inversiones García SAC |
| 6 | `inversor2` | `demo123` | Familia Rodríguez |
| 7 | `inversor3` | `demo123` | Fondo Capital Plus |

### 🛒 Compradores (Total: 4)

| ID | Usuario | Contraseña | Nombre |
|----|---------|------------|--------|
| 1 | `comprador1` | `demo123` | Pedro Sánchez |
| 2 | `comprador2` | `demo123` | Luis Mendoza |
| 3 | `comprador3` | `demo123` | Carmen Vega |
| 4 | `alicia` | `demo123` | Alicia Peña Granilla |

---

## 🧪 Prueba Paso a Paso

### Test 1: Login como Ssamira

1. Abre el navegador (F12 para consola)
2. Ve a: `file:///c:/Bacilio/Gestor_Pagos_Inventario/frontend/login.html`
3. Selecciona: **Inversionista** (botón izquierdo)
4. Usuario: `ssamira` (todo en minúsculas)
5. Contraseña: `demo123`
6. Click "Iniciar Sesión"
7. **Mira la consola del navegador** (F12) para ver errores

### Test 2: Login como Alicia

1. Refresca la página
2. Selecciona: **Comprador** (botón derecho)
3. Usuario: `alicia` (todo en minúsculas)
4. Contraseña: `demo123`
5. Click "Iniciar Sesión"

---

## 🔍 Verificación de Errores

### Abre la Consola del Navegador (F12)

**Debería mostrar:**
```
Usuario: ssamira
Contraseña: demo123
Endpoint: inversionistas
```

**Si ves un error de red:**
- Verifica que el backend esté corriendo: `http://localhost:3002`
- Abre en navegador: `http://localhost:3002/api/inversionistas`
- Debería mostrar un JSON con todos los inversionistas

**Si el API funciona pero el login falla:**
- El problema está en la comparación del password
- Voy a revisar el código del login

---

## ⚠️ Posibles Causas

1. **CORS**: El navegador bloquea la petición
2. **Backend no corriendo**: Puerto 3002 no responde
3. **Comparación de passwords**: Hay espacios extras o caracteres especiales
4. **Campo activo**: El usuario tiene `activo = FALSE`

---

## 🛠️ Solución Rápida

**Prueba esto en la consola del navegador (F12 → Console):**

```javascript
fetch('http://localhost:3002/api/inversionistas')
  .then(r => r.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

**Debería mostrar:**
```json
[
  {
    "id": 4,
    "nombre": "Ssamira Xiomara Checya Peña",
    "usuario": "ssamira",
    "password_hash": "demo123",
    "activo": true
  },
  ...
]
```

Si ves esto, el API funciona. El problema es en el código del login.

---

**Dime qué ves en la consola del navegador y te ayudo a solucionarlo** 🔧
