// Componente de Navegación Dinámica según Rol
function renderNavigation() {
  const userRole = sessionStorage.getItem('userRole');
  const userName = sessionStorage.getItem('userName');
  const userLogin = sessionStorage.getItem('userLogin');

  if (!userRole) return '';

  const isInPages = window.location.pathname.includes('/pages/');
  const rootPath = isInPages ? '../' : '';
  const pagesPath = isInPages ? '' : 'pages/';

  let dashboardLink = '';
  let navLinks = '';

  if (userRole === 'admin') {
    dashboardLink = rootPath + 'index.html';
    navLinks = `
      <li><a href="${rootPath}index.html" class="nav-link">📊 Dashboard</a></li>
      <li><a href="${pagesPath}productos.html" class="nav-link">📦 Productos</a></li>
      <li><a href="${pagesPath}distribuidores.html" class="nav-link">🏭 Distribuidores</a></li>
      <li><a href="${pagesPath}pedidos.html" class="nav-link">📋 Pedidos</a></li>
      <li><a href="${pagesPath}inversionistas.html" class="nav-link">💰 Inversionistas</a></li>
      <li><a href="${pagesPath}compradores.html" class="nav-link">🛒 Compradores</a></li>
    `;
  } else if (userRole === 'inversionista') {
    dashboardLink = rootPath + 'dashboard-inversionista.html';
    navLinks = `
      <li><a href="${rootPath}dashboard-inversionista.html" class="nav-link">🏠 Mi Dashboard</a></li>
      <li><a href="${pagesPath}productos.html" class="nav-link">📦 Productos</a></li>
      <li><a href="${pagesPath}distribuidores.html" class="nav-link">🏭 Distribuidores</a></li>
      <li><a href="${pagesPath}pedidos.html" class="nav-link">📋 Mis Pedidos</a></li>
      <li><a href="${pagesPath}compradores.html" class="nav-link">🛒 Compradores</a></li>
    `;
  } else if (userRole === 'comprador') {
    dashboardLink = rootPath + 'dashboard-comprador.html';
    navLinks = `
      <li><a href="${rootPath}dashboard-comprador.html" class="nav-link">🏠 Mi Dashboard</a></li>
      <li><a href="${pagesPath}pedidos.html" class="nav-link">📋 Mis Pedidos</a></li>
      <li><a href="${pagesPath}estado-cuenta.html" class="nav-link">📄 Facturaciones</a></li>
      <li><a href="${pagesPath}ventas-mayoristas.html" class="nav-link">📦 Ventas Mayoristas</a></li>
    `;
  }

  return `
    <div id="nav-overlay" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:1099;" onclick="toggleMobileMenu()"></div>
    <nav class="navbar">
      <div class="navbar-container">
        <a href="${dashboardLink}" class="navbar-brand">🏪 Gestor de Inventario</a>
        <button class="navbar-toggle" onclick="toggleMobileMenu(event)" aria-label="Abrir menú"
          style="background:rgba(255,255,255,0.15); border:1.5px solid rgba(255,255,255,0.4); border-radius:8px; padding:0.5rem;">
            <span style="display:block; width:24px; height:2px; background:#fff; margin:5px auto; border-radius:2px;"></span>
            <span style="display:block; width:24px; height:2px; background:#fff; margin:5px auto; border-radius:2px;"></span>
            <span style="display:block; width:24px; height:2px; background:#fff; margin:5px auto; border-radius:2px;"></span>
        </button>
        <!-- Desktop: nombre + botón salir (oculto en móvil) -->
        <ul class="navbar-nav">
          ${navLinks}
          <li class="nav-desktop-user" style="margin-left:auto; display:flex; align-items:center; gap:0.5rem;">
            <span style="color:#ffffff; font-weight:600; font-size:0.875rem;">👤 ${userName || userLogin}</span>
            <a href="${rootPath}login.html" class="nav-link" style="color:rgba(255,100,100,0.9);" onclick="sessionStorage.clear(); localStorage.clear();">🚪 Salir</a>
          </li>
          <!-- Móvil: encabezado del panel con × (solo visible en panel móvil) -->
          <li class="nav-mobile-header">
            <span>👤 ${userName || userLogin}</span>
            <button onclick="toggleMobileMenu()">×</button>
          </li>
          <li class="nav-mobile-logout">
            <a href="${rootPath}login.html" class="nav-link" onclick="sessionStorage.clear(); localStorage.clear();">🚪 Cerrar Sesión</a>
          </li>
        </ul>
      </div>
    </nav>
  `;
}

// Insertar navegación al cargar página
document.addEventListener('DOMContentLoaded', () => {
  const navPlaceholder = document.getElementById('dynamic-nav');
  if (navPlaceholder) {
    navPlaceholder.outerHTML = renderNavigation();
  }
});

// Verificar autenticación
function checkAuth() {
  const userRole = sessionStorage.getItem('userRole');
  const currentPage = window.location.pathname.split('/').pop();

  // Si no hay sesión y no estamos en login, redirigir
  if (!userRole && currentPage !== 'login.html') {
    window.location.href = '/login.html';
    return false;
  }

  return true;
}

// Global scope for responsive toggle function
window.toggleMobileMenu = function (event) {
  if (event) event.stopPropagation();

  const nav = document.querySelector('.navbar-nav');
  const toggle = document.querySelector('.navbar-toggle');
  const overlay = document.getElementById('nav-overlay');

  if (nav && toggle) {
    const isOpen = nav.classList.contains('active');
    if (isOpen) {
      nav.classList.remove('active');
      toggle.classList.remove('active');
      if (overlay) overlay.style.display = 'none';
      document.body.style.overflow = '';
    } else {
      nav.classList.add('active');
      toggle.classList.add('active');
      if (overlay) overlay.style.display = 'block';
      document.body.style.overflow = 'hidden';
    }
  }
};

// Close menu when clicking outside the navbar
document.addEventListener('click', (e) => {
  const nav = document.querySelector('.navbar-nav');
  const toggle = document.querySelector('.navbar-toggle');
  const navbar = document.querySelector('.navbar');

  if (nav && toggle && navbar && nav.classList.contains('active')) {
    if (!navbar.contains(e.target)) {
      nav.classList.remove('active');
      toggle.classList.remove('active');
    }
  }
});

// Close menu when clicking a nav link
document.addEventListener('click', (e) => {
  if (e.target.closest('.nav-link') && window.innerWidth <= 768) {
    const nav = document.querySelector('.navbar-nav');
    const toggle = document.querySelector('.navbar-toggle');
    if (nav && toggle) {
      nav.classList.remove('active');
      toggle.classList.remove('active');
    }
  }
});
