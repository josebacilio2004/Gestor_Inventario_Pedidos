# 🐳 Inicio Rápido con Docker

## ✅ Ventajas de usar Docker
- ✅ No necesitas instalar PostgreSQL
- ✅ Configuración automática
- ✅ Base de datos aislada
- ✅ Fácil de iniciar y detener

## 📋 Requisitos

Solo necesitas tener **Docker Desktop** instalado:
- Descarga desde: https://www.docker.com/products/docker-desktop/

## 🚀 Pasos de Instalación (3 minutos)

### Paso 1: Iniciar la Base de Datos con Docker

```powershell
# Desde la raíz del proyecto
docker-compose up -d
```

Esto va a:
- ✅ Descargar la imagen de PostgreSQL (solo la primera vez)
- ✅ Crear el contenedor `gestor-inventario-db`
- ✅ Crear la base de datos `gestor_inventario`
- ✅ Ejecutar automáticamente el esquema SQL
- ✅ Insertar los datos de ejemplo

Espera unos 10-20 segundos para que la base de datos esté lista.

### Paso 2: Verificar que el Contenedor Esté Corriendo

```powershell
docker ps
```

Deberías ver algo como:
```
CONTAINER ID   IMAGE                COMMAND                  STATUS
xxxxx          postgres:16-alpine   "docker-entrypoint..."   Up X seconds (healthy)
```

### Paso 3: Configurar el Backend

```powershell
# Copiar el archivo de configuración
cd backend
copy .env.docker .env
```

O simplemente crea un archivo `.env` en `backend/` con este contenido:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=gestor_inventario
```

### Paso 4: Iniciar el Servidor Backend

```powershell
# Asegúrate de estar en la carpeta backend
cd backend
npm start
```

Deberías ver:
```
🚀 Servidor corriendo en http://localhost:3000
✓ Conectado a PostgreSQL
```

### Paso 5: Abrir el Frontend

Abre el archivo en tu navegador:
```
c:\Bacilio\Gestor_Pagos_Inventario\frontend\index.html
```

O simplemente haz **doble clic** en `frontend/index.html`

---

## 🎉 ¡Listo!

Tu sistema está funcionando completamente con Docker.

---

## 🛠️ Comandos Útiles de Docker

### Ver logs de la base de datos
```powershell
docker logs gestor-inventario-db
```

### Detener la base de datos
```powershell
docker-compose down
```

### Reiniciar la base de datos (borra todos los datos)
```powershell
docker-compose down -v
docker-compose up -d
```

### Conectarse a la base de datos directamente
```powershell
docker exec -it gestor-inventario-db psql -U postgres -d gestor_inventario
```

Dentro de PostgreSQL puedes ejecutar:
```sql
\dt              -- Ver todas las tablas
SELECT * FROM productos;
SELECT * FROM distribuidores;
SELECT * FROM pedidos;
\q               -- Salir
```

### Ver el estado del contenedor
```powershell
docker ps -a
```

---

## 🔧 Solución de Problemas

### Error: "puerto 5432 ya está en uso"
Tienes PostgreSQL instalado localmente. Opciones:
1. Detén PostgreSQL local: `net stop postgresql-x64-16` (ajusta la versión)
2. O cambia el puerto en `docker-compose.yml`:
   ```yaml
   ports:
     - "5433:5432"  # Usar puerto 5433
   ```
   Y actualiza `backend/.env`:
   ```env
   DB_PORT=5433
   ```

### Error: "Cannot connect to Docker daemon"
Docker Desktop no está corriendo:
1. Abre Docker Desktop
2. Espera a que diga "Docker Desktop is running"
3. Vuelve a ejecutar `docker-compose up -d`

### La base de datos no se crea
```powershell
# Fuerza la recreación
docker-compose down -v
docker-compose up -d --force-recreate
```

---

## 📊 Datos de Ejemplo

La base de datos se inicializa con:
- ✅ 5 productos de ejemplo (cemento, tornillos, pintura, etc.)
- ✅ 3 distribuidores de ejemplo
- ✅ Esquema completo con triggers

Puedes eliminar estos datos desde el frontend o agregar los tuyos propios.

---

**Tiempo total: 3 minutos** ⏱️
