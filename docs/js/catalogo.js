// Catalog page functionality

let allProducts = [];

// Load all products
async function loadCatalogProducts() {
    try {
        const productos = await fetchAPI('/productos');
        allProducts = productos.filter(p => p.activo);
        renderProducts(allProducts);
    } catch (error) {
        console.error('Error al cargar catálogo:', error);
        const grid = document.getElementById('products-grid');
        grid.innerHTML = '<p class="text-center text-secondary">Error al cargar productos. Por favor, intenta más tarde.</p>';
    }
}

// Render products to grid
function renderProducts(productos) {
    const grid = document.getElementById('products-grid');
    const countEl = document.getElementById('products-count');

    countEl.textContent = `📦 ${productos.length} producto${productos.length !== 1 ? 's' : ''} disponible${productos.length !== 1 ? 's' : ''}`;

    if (productos.length === 0) {
        grid.innerHTML = '<p class="text-center text-secondary">No se encontraron productos</p>';
        return;
    }

    grid.innerHTML = productos.map(producto => `
        <div class="product-card">
            <div class="product-image" style="display: flex; align-items: center; justify-content: center; font-size: 4rem;">
                🔨
            </div>
            <h3 class="product-name">${producto.nombre}</h3>
            <p class="product-description">${producto.descripcion || 'Producto de ferretería de alta calidad'}</p>
            ${producto.stock_actual > 0 ?
            `<div class="stock-badge" style="color: var(--success); font-size: 0.875rem; margin-bottom: 0.5rem;">✅ En stock (${producto.stock_actual})</div>` :
            '<div class="stock-badge" style="color: var(--danger); font-size: 0.875rem; margin-bottom: 0.5rem;">❌ Agotado</div>'
        }
            <div class="product-price">${formatCurrency(producto.precio_venta)}</div>
            <a href="tel:+51951679240" class="btn btn-primary">📞 Consultar</a>
        </div>
    `).join('');
}

// Search functionality
function searchProducts() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();

    const filtered = allProducts.filter(producto => {
        return producto.nombre.toLowerCase().includes(searchTerm) ||
            (producto.descripcion && producto.descripcion.toLowerCase().includes(searchTerm)) ||
            (producto.tipo_producto && producto.tipo_producto.toLowerCase().includes(searchTerm));
    });

    renderProducts(filtered);
}

// Setup search listener
document.addEventListener('DOMContentLoaded', () => {
    loadCatalogProducts();

    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', searchProducts);
});
