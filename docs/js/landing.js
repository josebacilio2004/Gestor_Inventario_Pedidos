// Landing page functionality

// Load featured products
async function loadFeaturedProducts() {
    try {
        const productos = await fetchAPI('/productos');

        // Get first 4 active products
        const featured = productos.filter(p => p.activo).slice(0, 4);

        const grid = document.getElementById('featured-products-grid');

        if (featured.length === 0) {
            grid.innerHTML = '<p class="text-center text-secondary">No hay productos disponibles actualmente</p>';
            return;
        }

        grid.innerHTML = featured.map(producto => `
            <div class="product-card">
                <div class="product-image" style="display: flex; align-items: center; justify-content: center; font-size: 4rem;">
                    🔨
                </div>
                <h3 class="product-name">${producto.nombre}</h3>
                <p class="product-description">${producto.descripcion || 'Producto de ferretería'}</p>
                <div class="product-price">${formatCurrency(producto.precio_venta)}</div>
                <a href="catalogo.html" class="btn btn-primary">Ver más</a>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error al cargar productos destacados:', error);
        const grid = document.getElementById('featured-products-grid');
        grid.innerHTML = '<p class="text-center text-secondary">Error al cargar productos</p>';
    }
}

// Load on page ready
document.addEventListener('DOMContentLoaded', loadFeaturedProducts);
