# 🚀 Guía Rápida - Deploy GitHub Pages

## Pre-requisitos

✅ Sistema funcionando localmente  
✅ Git configurado  
✅ Repositorio: `https://github.com/josebacilio2004/Gestor_Inventario_Pedidos.git`

---

## Paso 1: Preparar Frontend para Producción

### Crear `frontend/js/config.js`:

```javascript
// Configuración de API según entorno
const API_CONFIG = {
    development: 'http://localhost:3002',
    production: 'https://tu-backend.onrender.com' // Actualizar después del deploy backend
};

const API_URL = window.location.hostname === 'localhost' 
    ? API_CONFIG.development
    : API_CONFIG.production;

window.API_URL = API_URL;
console.log('🌍 Entorno:', window.location.hostname === 'localhost' ? 'DESARROLLO' : 'PRODUCCIÓN');
console.log('🔗 API URL:', API_URL);
```

### Actualizar `frontend/js/app.js`:

En la función `fetchAPI`, cambiar:

```javascript
// ANTES:
const url = `http://localhost:3002/api${endpoint}`;

// DESPUÉS:
const url = `${window.API_URL}/api${endpoint}`;
```

### Crear `.nojekyll` y `404.html`:

```powershell
# En  la carpeta frontend/
New-Item -ItemType File -Path "frontend/.nojekyll"
```

**Crear `frontend/404.html`:**
```html
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Distribuidora Ss&M</title>
<script>sessionStorage.redirect=location.href</script>
<meta http-equiv="refresh" content="0;URL='/'"></head><body></body></html>
```

---

## Paso 2: Commit y Push

```powershell
cd c:\Bacilio\Gestor_Pagos_Inventario

# Ver cambios
git status

# Agregar todos los archivos
git add .

# Commit (ya realizado)
git commit -m "feat: Sistema v2.0 listo para producción"

# Push a GitHub
git push origin main
```

---

## Paso 3: Configurar GitHub Pages

### En GitHub.com:

1. Ve a: `https://github.com/josebacilio2004/Gestor_Inventario_Pedidos`
2. Click en **Settings** (⚙️)
3. En el menú lateral → **Pages**
4. En "Source":
   - Branch: `main`
   - Folder: `/frontend`
5. Click **Save**

⏳ **Espera 2-3 minutos** para que GitHub Pages construya el sitio.

### URL Final:
```
https://josebacilio2004.github.io/Gestor_Inventario_Pedidos/
```

---

## Paso 4: Deploy Backend (Render.com)

### 4.1 Crear cuenta en Render

1. Ve a: `https://render.com`
2. Sign up con GitHub
3. Autoriza acceso al repositorio

### 4.2 Crear Web Service

1. Dashboard → **New +** → **Web Service**
2. Connect repository: `Gestor_Inventario_Pedidos`
3. Configuración:
   - **Name**: `gestor-inventario-backend`
   - **Environment**: Node
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. **Plan**: Free
5. Click **Create Web Service**

### 4.3 Agregar PostgreSQL

1. Dashboard → **New +** → **PostgreSQL**
2. **Name**: `gestor-inventario-db`
3. **Plan**: Free
4. Click **Create Database**
5. **Copiar** "Internal Database URL"

### 4.4 Conectar DB al Backend

1. Ve al Web Service `gestor-inventario-backend`
2. **Environment** → **Add Environment Variable**:
   - Key: `DATABASE_URL`
   - Value: [Pegar Internal Database URL]
3. **Save Changes**

### 4.5 Migrar Base de Datos

Una vez el backend esté desplegado:

1. Render Dashboard → PostgreSQL → **Connect**
2. Copiar comando PSQL
3. En tu terminal local:

```powershell
# Exportar schema local
docker exec gestor-inventario-db pg_dump -U postgres -d gestor_inventario --schema-only > schema.sql

# Conectar a Render PostgreSQL (usar comando copiado)
psql -h [host] -U [user] -d [database] < schema.sql
```

### 4.6 Copiar URL del Backend

Render te dará una URL como:
```
https://gestor-inventario-backend.onrender.com
```

**Copiar esta URL** para el siguiente paso.

---

## Paso 5: Actualizar Frontend con URL del Backend

### Editar `frontend/js/config.js`:

```javascript
const API_CONFIG = {
    development: 'http://localhost:3002',
    production: 'https://gestor-inventario-backend.onrender.com' // ← TU URL DE RENDER
};
```

### Commit y push:

```powershell
git add frontend/js/config.js
git commit -m "config: URL backend de producción"
git push origin main
```

⏳ **Espera 1-2 minutos** para que GitHub Pages se actualice.

---

## Paso 6: Probar el Sistema

### Abrir:
```
https://josebacilio2004.github.io/Gestor_Inventario_Pedidos/login.html
```

### Probar login:

**Admin:**
- Usuario: `admin`
- Contraseña: `admin123`

**Comprador:**
- Usuario: `alicia`
- Contraseña: `demo123`

**Inversionista:**
- Usuario: `ssamira`
- Contraseña: `demo123`

---

## ✅ Checklist Deployment

- [ ] `config.js` creado con API_URL
- [ ] `.nojekyll` creado
- [ ] `404.html` creado
- [ ] `app.js` usa `window.API_URL`
- [ ] Commit y push a GitHub
- [ ] GitHub Pages activado (/frontend)
- [ ] Backend en Render deployado
- [ ] PostgreSQL creado y conectado
- [ ] Schema migrado a Render DB
- [ ] URL backend actualizada en `config.js`
- [ ] Segundo commit/push
- [ ] Login probado en producción

---

## 🆘 Solución de Problemas

### Error: "Failed to fetch"
- Verificar que backend Render esté en "Running" (no "Sleeping")
- Plan Free de Render duerme después de inactividad, esperar 30s

### Error: CORS
Agregar en `backend/server.js`:
```javascript
const cors = require('cors');
app.use(cors({
    origin: 'https://josebacilio2004.github.io',
    credentials: true
}));
```

### Base de datos vacía en producción
Ejecutar script de seed:
```powershell
psql [URL-RENDER] < database/seed.sql
```

---

**🎉 ¡Sistema en Producción!** 🚀
