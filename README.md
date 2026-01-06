# 🏪 Sistema de Gestión de Inventario, Pagos e Inversión

Sistema completo de gestión para ferreterías con tracking de inversiones, devolución progresiva de capital, y control de ganancias.

## 🚀 Características Principales

- ✅ **Gestión de Productos y Distribuidores**
- ✅ **Sistema de Inversión y Capital Progresivo**
- ✅ **Autenticación por Roles** (Inversionistas y Compradores)
- ✅ **Dashboards Personalizados**
- ✅ **Tracking Automático de Pagos**
- ✅ **Moneda en Soles Peruanos (S/)**
- ✅ **Base de Datos PostgreSQL con Docker**
- ✅ **API REST con Node.js/Express**
- ✅ **Frontend Moderno con Glassmorphism**

## 📋 Requisitos

- Node.js v14+
- Docker Desktop
- Navegador web moderno

## 🔧 Instalación Rápida

```bash
# 1. Iniciar base de datos con Docker
docker-compose up -d

# 2. Instalar dependencias del backend
cd backend
npm install

# 3. Iniciar servidor backend
npm start

# 4. Abrir frontend
# Abrir en navegador: frontend/login.html
```

## 👥 Usuarios del Sistema

### Inversionistas
- `ssamira` / `demo123` - Ssamira Xiomara Checya Peña
- `inversor2` / `demo123` - Familia Rodríguez
- `inversor3` / `demo123` - Fondo Capital Plus

### Compradores Principales
- `alicia` / `demo123` - Alicia Peña Granilla
- `comprador2` / `demo123` - Luis Mendoza
- `comprador3` / `demo123` - Carmen Vega

## 📚 Documentación

- [CREDENCIALES.md](CREDENCIALES.md) - Credenciales de acceso
- [DOCKER.md](DOCKER.md) - Guía de Docker
- [DBEAVER.md](DBEAVER.md) - Configuración de DBeaver

## 🏗️ Arquitectura

```
Frontend (HTML/CSS/JS)
    ↓
Backend API (Express/Node.js) - Puerto 3002
    ↓
PostgreSQL (Docker) - Puerto 5433
```

## 📊 Flujo de Negocio

1. **Inversionista** provee capital inicial
2. **Comprador Principal** gestiona compra de productos
3. **Comprador** vende y genera ganancias
4. **Comprador** devuelve capital PROGRESIVAMENTE
5. **Inversionista** recibe capital + ganancia

## 🛠️ Tecnologías

- **Backend**: Node.js, Express, PostgreSQL
- **Frontend**: HTML5, CSS3, JavaScript Vanilla
- **Base de Datos**: PostgreSQL 16 (Docker)
- **Contenedores**: Docker Compose

## 📝 Licencia

MIT

## 👨‍💻 Autor

Sistema desarrollado para gestión de ferretería con control de inversiones.
