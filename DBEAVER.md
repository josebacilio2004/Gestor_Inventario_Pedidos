# 🗄️ Conectar DBeaver a la Base de Datos PostgreSQL

DBeaver es una herramienta gráfica profesional para gestionar bases de datos. Aquí te muestro cómo conectarla a tu base de datos Docker.

## 📥 Paso 1: Descargar DBeaver

Si aún no lo tienes:

1. Ve a: https://dbeaver.io/download/
2. Descarga **DBeaver Community Edition** (gratis)
3. Instala el programa

## 🔌 Paso 2: Crear Nueva Conexión

### 1. Abrir DBeaver

- Inicia DBeaver

### 2. Nueva Conexión

- Click en **"Nueva Conexión"** (Database → New Database Connection)
- O presiona el ícono de enchufe en la barra de herramientas ⚡

### 3. Seleccionar PostgreSQL

- Busca y selecciona **PostgreSQL**
- Click en **"Siguiente"**

### 4. Configurar la Conexión

Ingresa los siguientes datos:

```
Host: localhost
Port: 5433   (⚠️ NOTA: Es 5433, NO 5432)
Database: gestor_inventario
Username: postgres
Password: postgres
```

**Detalles:**
- ✅ **Host**: `localhost` (porque Docker expone el puerto localmente)
- ✅ **Port**: `5433` (cambiamos del 5432 por defecto para evitar conflictos)
- ✅ **Database**: `gestor_inventario`
- ✅ **Username**: `postgres`
- ✅ **Password**: `postgres`

### 5. Probar Conexión

- Click en **"Test Connection"** (Probar Conexión)
- Deberías ver: ✅ **"Connected"**
- Si DBeaver pide descargar drivers, acepta

### 6. Finalizar

- Click en **"Finish"** (Finalizar)

---

## 📊 Usar DBeaver

### Ver las Tablas

1. En el panel izquierdo, expande:
   - **PostgreSQL - gestor_inventario**
   - **Databases**
   - **gestor_inventario**
   - **Schemas**
   - **public**
   - **Tables**

2. Verás 3 tablas:
   - 📦 **productos**
   - 🏢 **distribuidores**
   - 📋 **pedidos**

### Ver Datos

- **Doble click** en cualquier tabla
- Click en la pestaña **"Data"**
- Verás todos los registros

### Ejecutar Consultas SQL

1. Click derecho en la conexión → **"SQL Editor"** → **"New SQL Script"**

2. Ejemplos de consultas:

```sql
-- Ver todos los productos
SELECT * FROM productos;

-- Ver todos los distribuidores
SELECT * FROM distribuidores;

-- Ver pedidos con información completa
SELECT 
    p.*,
    prod.nombre as producto,
    d.nombre as distribuidor
FROM pedidos p
LEFT JOIN productos prod ON p.producto_id = prod.id
LEFT JOIN distribuidores d ON p.distribuidor_id = d.id
ORDER BY p.fecha_pedido DESC;

-- Estadísticas
SELECT 
    COUNT(*) as total_pedidos,
    SUM(capital_invertido) as capital_total,
    SUM(ganancia_real) as ganancia_total
FROM pedidos;
```

3. Selecciona la consulta y presiona **Ctrl+Enter** o click en ▶️

### Editar Datos

1. Abre una tabla (doble click)
2. En la pestaña **"Data"**:
   - Modifica valores directamente en la tabla
   - Agrega filas: Click en el botón **+**
   - Elimina filas: Selecciona y presiona **Delete**
3. **Guarda los cambios**: Click en **"Save"** o **Ctrl+S**

---

## 🔧 Solución de Problemas

### Error: "Connection refused" o "No se puede conectar"

**Problema**: Docker no está corriendo o el contenedor está detenido

**Solución**:
```powershell
# Verificar si el contenedor está corriendo
docker ps

# Si no aparece, iniciarlo
cd c:\Bacilio\Gestor_Pagos_Inventario
docker-compose up -d

# Verificar de nuevo
docker ps
```

### Error: "Authentication failed"

**Problema**: Contraseña incorrecta

**Solución**:
- Verifica que la contraseña sea: `postgres`
- Verifica el usuario sea: `postgres`

### Error: "Database does not exist"

**Problema**: La base de datos no se creó

**Solución**:
```powershell
# Reiniciar el contenedor con volumen limpio
docker-compose down -v
docker-compose up -d

# Esperar 10 segundos y reconectar DBeaver
```

### Puerto Incorrecto

**Recuerda**: El puerto es **5433**, NO 5432
- 5432 es el puerto estándar de PostgreSQL
- 5433 es el que configuramos en Docker para evitar conflictos

---

## 💡 Tips Profesionales

### 1. Favoritos

Guarda consultas frecuentes:
- Click derecho en la consulta → **"Add to Favorites"**

### 2. Exportar Datos

- Click derecho en tabla → **"Export Data"**
- Elige formato: CSV, JSON, Excel, etc.

### 3. Diagrama ER (Entity Relationship)

Ver las relaciones entre tablas:
- Click derecho en **"public"** (schema) → **"View Diagram"**
- Verás un diagrama visual de tu base de datos

### 4. Backup de la Base de Datos

Desde DBeaver:
- Click derecho en **gestor_inventario** → **"Tools"** → **"Backup"**
- Sigue el asistente

---

## 🆚 DBeaver vs Terminal

| Acción | Terminal | DBeaver |
|--------|----------|---------|
| **Ver datos** | `SELECT * FROM tabla` | Doble click en tabla |
| **Editar** | Consultas SQL complejas | Click y edita directamente |
| **Visualizar relaciones** | Sólo con conocimiento | Diagrama automático |
| **Filtrar** | Escribir WHERE | Click en filtro de columna |

---

## ℹ️ Información de Conexión (Resumen)

Para referencia rápida:

```
🔌 Connection Details:
━━━━━━━━━━━━━━━━━━━━
Host:     localhost
Port:     5433
Database: gestor_inventario
User:     postgres
Password: postgres
━━━━━━━━━━━━━━━━━━━━
```

---

¡Ahora puedes gestionar tu base de datos visualmente con DBeaver! 🎉
