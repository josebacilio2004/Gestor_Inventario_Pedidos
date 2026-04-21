# Instrucciones de Instalación - PostgreSQL No Detectado

## ⚠️ PostgreSQL No Está Instalado

He detectado que PostgreSQL no está instalado en tu sistema. Tienes **3 opciones**:

---

## 🎯 OPCIÓN 1: Instalar PostgreSQL (Recomendado)

### Paso 1: Descargar PostgreSQL
1. Ve a: https://www.postgresql.org/download/windows/
2. Descarga el instalador de Windows
3. Ejecuta el instalador

### Paso 2: Durante la instalación
- **Puerto**: Deja el puerto por defecto (5432)
- **Contraseña de superusuario**: Usa `postgres` (o anota la que uses)
- **Locale**: Deja el por defecto

### Paso 3: Después de instalar
Agrega PostgreSQL al PATH de Windows:
1. Busca "Variables de entorno" en Windows
2. Edita la variable PATH
3. Agrega: `C:\Program Files\PostgreSQL\16\bin` (ajusta la versión si es diferente)
4. Reinicia tu terminal

### Paso 4: Crear la base de datos
```powershell
# Verificar instalación
psql --version

# Conectar a PostgreSQL
psql -U postgres

# En el prompt de PostgreSQL:
CREATE DATABASE gestor_inventario;
\q
```

### Paso 5: Ejecutar el esquema
```powershell
psql -U postgres -d gestor_inventario -f database/schema.sql
```

---

## 🔧 OPCIÓN 2: Usar pgAdmin (Interfaz Gráfica)

Si instalaste PostgreSQL con pgAdmin:

### Paso 1: Abrir pgAdmin
- Busca "pgAdmin 4" en tu menú de inicio
- Conéctate con el usuario `postgres` y tu contraseña

### Paso 2: Crear la base de datos
1. Click derecho en "Databases"
2. Create > Database
3. Nombre: `gestor_inventario`
4. Save

### Paso 3: Ejecutar el esquema
1. Abre el archivo `database/schema.sql` en un editor de texto
2. Copia TODO el contenido
3. En pgAdmin: Click derecho en `gestor_inventario` > Query Tool
4. Pega el contenido del schema.sql
5. Click en el botón ▶️ Execute

---

## 🚀 OPCIÓN 3: Usar Docker (Para usuarios avanzados)

Si tienes Docker Desktop instalado:

```powershell
# Crear contenedor de PostgreSQL
docker run --name gestor-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=gestor_inventario -p 5432:5432 -d postgres:16

# Ejecutar el esquema
docker exec -i gestor-postgres psql -U postgres -d gestor_inventario < database/schema.sql
```

---

## 📝 Después de Configurar la Base de Datos

### 1. Crear archivo .env en la carpeta backend

Crea un archivo llamado `.env` dentro de `backend/` con este contenido:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=gestor_inventario
```

⚠️ **IMPORTANTE**: Cambia `DB_PASSWORD` si usaste otra contraseña durante la instalación.

### 2. Iniciar el servidor

```powershell
cd backend
npm start
```

### 3. Abrir el frontend

Abre `frontend/index.html` en tu navegador o haz doble clic en el archivo.

---

## ❓ ¿Cuál Opción Elegir?

- **¿Primera vez con PostgreSQL?** → OPCIÓN 1 (Instalación completa)
- **¿Prefieres interfaz gráfica?** → OPCIÓN 2 (pgAdmin)
- **¿Usas Docker?** → OPCIÓN 3 (Docker)

---

## 🆘 Si Tienes Problemas

Avísame en qué paso te quedaste y te ayudo específicamente.
