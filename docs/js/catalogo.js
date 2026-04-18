// Catalog page functionality - Ported to Industrial Forge Design
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
        grid.innerHTML = '<p class="text-center text-secondary col-span-full py-20 font-black uppercase tracking-widest text-xs opacity-50">Error al sincronizar inventario.</p>';
    }
}

/**
 * Lógica de Precios Públicos Decoplados:
 * En la administración se maneja el precio base (precio_referencia).
 * Para el catálogo público, aplicamos un margen comercial del 40% (x1.4) 
 * para mostrar un precio de mercado profesional.
 */
function calculatePublicPrice(producto) {
    // Usamos precio_venta si existe, sino usamos precio_referencia como base
    const basePrice = parseFloat(producto.precio_venta || producto.precio_referencia || 0);
    if (basePrice <= 0) return 'Consulte';
    
    // Aplicamos el margen del 40% solicitado para separar catálogo de admin
    const publicPrice = basePrice * 1.40;
    return formatCurrency(publicPrice);
}

// Render products to grid
function renderProducts(productos) {
    const grid = document.getElementById('products-grid');
    const countEl = document.getElementById('products-count');

    countEl.textContent = `🔩 Mostrando ${productos.length} unidades de alta precisión en stock.`;

    if (productos.length === 0) {
        grid.innerHTML = '<p class="text-center text-secondary col-span-full py-20 font-black uppercase tracking-widest text-xs opacity-50">Sin resultados para esta búsqueda.</p>';
        return;
    }

    grid.innerHTML = productos.map(producto => {
        const publicPrice = calculatePublicPrice(producto);
        const hasStock = producto.stock_actual > 0;
        
        return `
            <div class="group relative overflow-hidden glass-effect border border-slate-200/40 dark:border-slate-800/40 p-1 flex flex-col transition-all duration-500 hover:shadow-[0_40px_80px_rgba(15,33,55,0.12)] hover:-translate-y-2">
                <!-- Image Container -->
                <div class="aspect-square bg-slate-100/50 dark:bg-slate-900/50 overflow-hidden relative">
                    ${producto.imagen_url
                        ? `<img src="${producto.imagen_url}" alt="${producto.nombre}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">`
                        : ''
                    }
                    <div class="absolute inset-0 flex items-center justify-center text-6xl opacity-10 font-black pointer-events-none ${producto.imagen_url ? 'hidden' : 'flex'}">ALY</div>
                    
                    <!-- Stock Overlay -->
                    <div class="absolute top-4 right-4">
                        <span class="px-3 py-1 ${hasStock ? 'bg-secondary-container' : 'bg-slate-500'} text-white text-[9px] font-black uppercase tracking-widest rounded-sm shadow-lg">
                            ${hasStock ? `IN STOCK: ${producto.stock_actual}` : 'OUT OF STOCK'}
                        </span>
                    </div>
                </div>

                <!-- Info Container -->
                <div class="p-6 flex-1 flex flex-col">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-container mb-1">${producto.tipo_producto || 'HERRAMIENTA'}</p>
                            <h3 class="font-black text-xl uppercase tracking-tighter text-slate-900 group-hover:text-secondary-container transition-colors">${producto.nombre}</h3>
                        </div>
                        <span class="material-symbols-outlined text-outline group-hover:rotate-45 transition-transform">bolt</span>
                    </div>

                    <p class="text-xs text-slate-500 font-medium leading-relaxed mb-6 line-clamp-2">
                        ${producto.description || producto.descripcion || 'Herramienta industrial forjada con tratamiento térmico para máxima durabilidad en condiciones extremas.'}
                    </p>

                    <div class="mt-auto pt-6 border-t border-slate-100 flex justify-between items-end">
                        <div class="flex flex-col">
                            <span class="text-[9px] font-black uppercase tracking-widest text-slate-400">Precio Sugerido</span>
                            <span class="text-2xl font-black text-primary tracking-tighter">${publicPrice}</span>
                        </div>
                        <a href="https://wa.me/51951679240?text=Hola%2C+estoy+interesado+en+${encodeURIComponent(producto.nombre)}" 
                           target="_blank"
                           class="bg-primary text-white p-3 rounded-sm hover:bg-secondary-container transition-colors shadow-lg">
                            <span class="material-symbols-outlined text-sm">shopping_cart</span>
                        </a>
                    </div>
                </div>
            </div>
        `;
    }).join('');
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
    if (searchInput) {
        searchInput.addEventListener('input', searchProducts);
    }
});
