# 🚀 Guía de Deployment - Backend a Render.com

## Paso 1: Importar Schema a Render PostgreSQL ✅

Ya tienes el `schema.sql` generado. Ahora impórtalo:

```powershell
# Conéctate con la External URL de Render
$env:PGPASSWORD='aKwzF4bDPb9WjioW636WbpCsJPsvFHfb'
psql -h dpg-d5gtujv5r7bs73b2a2u0-a.oregon-postgres.render.com -U gestor_inventario_kkj8_user -d gestor_inventario_kkj8 -f database/schema.sql
```

**Nota**: Si no tienes `psql` instalado localmente, puedes:
1. Usar el Render Shell desde el dashboard
2. O copiar/pegar el contenido de `database/schema.sql` directamente

---

## Paso 2: Configurar Backend para Producción

### 2.1 Actualizar `backend/config/database.js`

Cambia para usar variable de entorno:

```javascript
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/gestor_inventario',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = pool;
```

### 2.2 Agregar CORS en `backend/server.js`

Después de `const app = express();`, agrega:

```javascript
const cors = require('cors');

// CORS para GitHub Pages
app.use(cors({
    origin: [
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'https://josebacilio2004.github.io'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 2.3 Instalar CORS

```powershell
cd backend
npm install cors --save
```

---

## Paso 3: Crear Web Service en Render

1. **Dashboard** → **New +** → **Web Service**
2. **Connect Repository**: `Gestor_Inventario_Pedidos`
3. **Configuración**:
   - Name: `gestor-inventario-backend`
   - Environment: **Node**
   - Region: **Oregon (US West)**
   - Branch: `main`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - Plan: **Free**

4. **Environment Variables**:
   - Key: `DATABASE_URL`
   - Value: `postgresql://gestor_inventario_kkj8_user:aKwzF4bDPb9WjioW636WbpCsJPsvFHfb@dpg-d5gtujv5r7bs73b2a2u0-a/gestor_inventario_kkj8`
   
   - Key: `NODE_ENV`
   - Value: `production`

5. **Create Web Service**

---

## Paso 4: Insertar Datos Iniciales (Usuarios)

Una vez el backend esté corriendo, necesitas insertar usuarios. Conéctate a Render PostgreSQL:

```sql
-- Admin
INSERT INTO usuarios_admin (nombre, usuario, password_hash, email, activo)
VALUES ('Administrador del Sistema', 'admin', 'admin123', 'admin@ssm.com', true);

-- Inversionistas
INSERT INTO inversionistas (nombre, contacto, telefono, email, usuario, password_hash, activo)
VALUES ('Ssamira Xiomara Checya Peña', 'Ssamira Checya', '987654321', 'ssamira@email.com', 'ssamira', 'demo123', true);

-- Compradores
INSERT INTO compradores (nombre, contacto, telefono, email, usuario, password_hash, activo)
VALUES ('Alicia Peña Granilla', 'Alicia Peña', '912345678', 'alicia@email.com', 'alicia', 'demo123', true);
```

---

## Paso 5: Obtener URL del Backend

Render te dará una URL como:
```
https://gestor-inventario-backend.onrender.com
```

**Copia esta URL** para configurar el frontend.

---

## Paso 6: Configurar Frontend

Crea `docs/js/config.js`:

```javascript
// Configuración de API según entorno
const API_CONFIG = {
    development: 'http://localhost:3002',
    production: 'https://gestor-inventario-backend.onrender.com'
};

const API_URL = window.location.hostname === 'localhost' 
    ? API_CONFIG.development
    : API_CONFIG.production;

window.API_URL = API_URL;
console.log('🌍 Entorno:', window.location.hostname === 'localhost' ? 'DESARROLLO' : 'PRODUCCIÓN');
console.log('🔗 API URL:', API_URL);
```

Actualiza `docs/js/app.js`:

```javascript
// Cambiar de:
const url = `http://localhost:3002/api${endpoint}`;

// A:
const url = `${window.API_URL}/api${endpoint}`;
```

Agrega `config.js` en todos los HTML **ANTES** de `app.js`:

```html
<script src="js/config.js"></script>
<script src="js/app.js"></script>
```

---

## Paso 7: Push Cambios

```powershell
git add .
git commit -m "feat: Configurar backend para producción con Render"
git push origin main
```

---

## ✅ Verificación Final

1. **Backend Render**: https://gestor-inventario-backend.onrender.com
2. **Frontend GitHub Pages**: https://josebacilio2004.github.io/Gestor_Inventario_Pedidos/

**Probar Login**:
- Admin: `admin` / `admin123`
- Ssamira: `ssamira` / `demo123`
- Alicia: `alicia` / `demo123`

---

**🎉 Sistema en Producción Completo!**
