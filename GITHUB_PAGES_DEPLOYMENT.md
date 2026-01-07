# 🚀 Deployment Guide - GitHub Pages

## Preparación del Frontend

### 1. Estructura del Proyecto

El frontend está en la carpeta `frontend/` y es completamente estático (HTML, CSS, JS). Para GitHub Pages necesitamos:

```
frontend/
├── index.html
├── login.html
├── dashboard-inversionista.html
├── dashboard-comprador.html
├── css/
├── js/
└── pages/
```

### 2. Configuración de API URL

**Crear `js/config.js`:**

```javascript
// Configuración de API según entorno
const API_CONFIG = {
    development: 'http://localhost:3002',
    production: 'https://tu-backend.herokuapp.com' // O Railway, Render, etc.
};

// Detectar entorno automáticamente
const API_URL = window.location.hostname === 'localhost' 
    ? API_CONFIG.development
    : API_CONFIG.production;

// Exportar para uso global
window.API_URL = API_URL;
```

**Actualizar `js/app.js`:**

```javascript
// Usar API_URL en lugar de localhost
async function fetchAPI(endpoint, options = {}) {
    const url = `${window.API_URL}/api${endpoint}`;
    // ...resto del código
}
```

### 3. Archivo .nojekyll

Crear `.nojekyll` en la raíz del frontend para que GitHub Pages no procese con Jekyll:

```bash
# En frontend/
touch .nojekyll
```

### 4. Archivo 404.html

Para que funcione como SPA (Single Page Application):

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Distribuidora Ss&M</title>
    <script>
        // Redirigir a index.html para manejo de rutas
        sessionStorage.redirect = location.href;
    </script>
    <meta http-equiv="refresh" content="0;URL='/'">
</head>
<body></body>
</html>
```

---

## Deployment a GitHub Pages

### Opción 1: Deploy desde carpeta /frontend

**Paso 1: Commit todo el código**

```bash
git add .
git commit -m "feat: Sistema completo con pagos de ganancia y UI corporativa"
git push origin main
```

**Paso 2: Configurar GitHub Pages**

1. Ve a tu repositorio en GitHub
2. Settings → Pages
3. Source: Deploy from a branch
4. Branch: `main` → Folder: `/frontend`
5. Save

**Paso 3: Esperar deployment**

GitHub Pages generará automáticamente el sitio en:
```
https://josebacilio2004.github.io/Gestor_Inventario_Pedidos/
```

### Opción 2: Deploy con gh-pages branch

**Ventaja:** URL más limpia sin `/frontend` en la ruta

```bash
# 1. Instalar gh-pages (si no está)
npm install -g gh-pages

# 2. Deploy solo la carpeta frontend
gh-pages -d frontend

# 3. Configurar GitHub Pages
# Settings → Pages → Source: gh-pages branch
```

---

## Backend en Producción

**No puedes usar `localhost:3002` en producción**. Necesitas deployar el backend.

### Opciones Recomendadas:

#### 1. **Render.com** (Gratis, fácil)

```bash
# 1. Crear cuenta en render.com
# 2. New → Web Service
# 3. Conectar repo GitHub
# 4. Root directory: backend
# 5. Build command: npm install
# 6. Start command: npm start
# 7. Add Environment Variables:
#    - DATABASE_URL=<tu-postgres-url>
```

#### 2. **Railway.app** (Gratis con créditos)

```bash
# 1. railway.app → New Project
# 2. Deploy from GitHub repo
# 3. Add PostgreSQL database
# 4. Variables de entorno automáticas
```

#### 3. **Heroku** (Más complejo)

```bash
# Crear Procfile en backend/
echo "web: node server.js" > backend/Procfile

# Deploy
heroku create tu-app-backend
git subtree push --prefix backend heroku main
```

### Configurar CORS en Backend

```javascript
// backend/server.js
const cors = require('cors');

app.use(cors({
    origin: [
        'http://localhost:5500',
        'http://localhost:3000',
        'https://josebacilio2004.github.io'
    ],
    credentials: true
}));
```

---

## Configuración de PostgreSQL en Producción

### Opción 1: Render PostgreSQL (Gratis)

1. Render Dashboard → New → PostgreSQL
2. Copiar `Internal Database URL`
3. Agregar a variables de entorno del backend

### Opción 2: ElephantSQL (Gratis)

1. elephantsql.com → Create New Instance
2. Plan: Tiny Turtle (Free)
3. Copiar URL de conexión
4. Actualizar `backend/config/database.js`:

```javascript
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
```

---

## Checklist Final

- [ ] API_URL configurada en `js/config.js`
- [ ] `.nojekyll` creado
- [ ] `404.html` para SPA routing
- [ ] Backend deployado en Render/Railway
- [ ] Base de datos PostgreSQL en producción
- [ ] CORS configurado en backend
- [ ] GitHub Pages activado
- [ ] Probar login desde GitHub Pages URL

---

## URLs Finales

```
Frontend:  https://josebacilio2004.github.io/Gestor_Inventario_Pedidos/
Backend:   https://tu-app-backend.onrender.com
Database:  PostgreSQL en Render/ElephantSQL
```

---

## Solución de Problemas

### Error: "Failed to fetch"

- Verificar que backend esté corriendo
- Revisar CORS en backend
- Confirmar API_URL correcta

### Error: 404 en rutas

- Verificar `404.html` existe
- Confirmar `.nojekyll` en raíz

### Base de datos no conecta

- Verificar DATABASE_URL en variables de entorno
- Confirmar SSL habilitado para producción

---

**✅ Con esto tu sistema estará 100% en línea** 🚀
