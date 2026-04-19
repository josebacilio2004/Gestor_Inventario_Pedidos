# ⚡ Inicio Rápido - Sistema de Gestión de Inventario

Este sistema ya está **85% configurado**. Solo necesitas completar estos pasos:

## ✅ Estado Actual
- ✅ Código backend completado
- ✅ Código frontend completado  
- ✅ Base de datos diseñada
- ✅ Dependencias instaladas
- ⚠️ **Falta**: PostgreSQL y configuración .env

## 🚀 Pasos Rápidos para Empezar

### Paso 1: Instalar PostgreSQL ⏱️ 5 minutos

**PostgreSQL no está instalado en tu sistema.** Necesitas instalarlo primero.

👉 **Sigue la guía completa aquí**: [INSTALACION_POSTGRES.md](./INSTALACION_POSTGRES.md)

**Resumen rápido:**
1. Descarga desde: https://www.postgresql.org/download/windows/
2. Instala con contraseña: `postgres`
3. Agrega al PATH de Windows (explicado en la guía)

### Paso 2: Crear la Base de Datos ⏱️ 2 minutos

Después de instalar PostgreSQL:

```powershell
# Conectar a PostgreSQL
psql -U postgres

# Crear la base de datos
CREATE DATABASE gestor_inventario;
\q

# Ejecutar el esquema
psql -U postgres -d gestor_inventario -f database/schema.sql
```

### Paso 3: Configurar el Backend ⏱️ 1 minuto

Crea un archivo llamado `.env` dentro de la carpeta `backend/` con este contenido:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=gestor_inventario
```

⚠️ Si usaste otra contraseña al instalar PostgreSQL, cámbiala en `DB_PASSWORD`.

### Paso 4: Iniciar el Servidor ⏱️ 30 segundos

```powershell
cd backend
npm start
```

Deberías ver:
```
🚀 Servidor corriendo en http://localhost:3000
✓ Conectado a PostgreSQL
```

### Paso 5: Abrir el Frontend ⏱️ 10 segundos

Simplemente abre el archivo en tu navegador:
```
c:\Bacilio\Gestor_Pagos_Inventario\frontend\index.html
```

O haz doble clic en: `frontend/index.html`

---

## 🎉 ¡Listo!

Tu sistema de gestión de inventario estará funcionando completamente.

## 📋 Características del Sistema

Una vez funcionando, podrás:
- ✅ Registrar productos de ferretería
- ✅ Gestionar distribuidores
- ✅ Crear pedidos con seguimiento de capital y ganancias
- ✅ Ver estadísticas en tiempo real
- ✅ Calcular devolución de capital para reinversión

## 🆘 ¿Problemas?

Si tienes algún error durante la instalación, revisa:

1. **Error "psql no reconocido"**: PostgreSQL no está en el PATH
   - Solución en [INSTALACION_POSTGRES.md](./INSTALACION_POSTGRES.md)

2. **Error de conexión a base de datos**: Verifica el archivo `.env`
   - Usuario y contraseña correctos
   - Base de datos creada

3. **Puerto 3000 ocupado**: Cambia el puerto en `.env`
   ```env
   PORT=3001
   ```

---

**Tiempo total estimado: 10 minutos** ⏱️
