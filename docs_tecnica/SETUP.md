# Guía Rápida de Configuración

## Paso 1: Configurar la Base de Datos

### Opción A: Si ya tienes PostgreSQL instalado

1. Crea la base de datos:
```bash
createdb gestor_inventario
```

O desde psql:
```sql
psql -U postgres
CREATE DATABASE gestor_inventario;
\q
```

2. Ejecuta el esquema:
```bash
psql -U postgres -d gestor_inventario -f database/schema.sql
```

### Opción B: Si no tienes PostgreSQL

1. Descarga PostgreSQL desde: https://www.postgresql.org/download/
2. Instala PostgreSQL (usa la contraseña "postgres" para simplicidad)
3. Sigue los pasos de la Opción A

## Paso 2: Configurar el Backend

1. Copia el archivo de ejemplo:
```bash
cd backend
copy .env.example .env
```

2. Edita el archivo `.env` con tus credenciales:
```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=TU_CONTRASEÑA_AQUI
DB_NAME=gestor_inventario
```

## Paso 3: Iniciar el Servidor

```bash
cd backend
npm start
```

Deberías ver:
```
🚀 Servidor corriendo en http://localhost:3000
✓ Conectado a PostgreSQL
```

## Paso 4: Abrir el Frontend

Simplemente abre en tu navegador:
```
file:///c:/Bacilio/Gestor_Pagos_Inventario/frontend/index.html
```

O haz doble clic en el archivo `frontend/index.html`

## ¡Listo!

Tu sistema está funcionando. Disfruta gestionando tu inventario 🎉
