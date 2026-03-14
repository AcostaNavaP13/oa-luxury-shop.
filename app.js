let WHATSAPP_NUMBER = "6143382041";

function generateWhatsAppLink(productName) {
    const message = `¡Hola! Estoy interesado en el producto: *${productName}*. ¿Aún tienen disponibilidad?`;
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
}

let allProducts = [];

async function renderCatalog() {
    const grid = document.getElementById("product-grid");
    if (!grid) return;

    // Show loaders...
    try {
        const settings = await Database.getSettings();
        WHATSAPP_NUMBER = settings.whatsapp || "6143382041";
    
        allProducts = await Database.getProducts();
        
        populateFilters();
        renderGrid(allProducts);

    } catch(err) {
        grid.innerHTML = "<p style='color: red; grid-column: 1 / -1; text-align:center;'>Hubo un error al cargar los productos.</p>";
    } finally {
        // Ocultar pantalla de carga
        const loader = document.getElementById("oa-loading");
        if(loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 500);
        }
    }
}

function processFilters() {
    let filtered = [...allProducts];
    
    // Filtros
    const cat = document.getElementById('filter-category').value;
    const brand = document.getElementById('filter-brand').value;
    const size = document.getElementById('filter-size').value;
    const sort = document.getElementById('sort-price').value;

    if (cat) filtered = filtered.filter(p => p.category === cat);
    if (brand) filtered = filtered.filter(p => p.brand === brand);
    
    if (size) {
        filtered = filtered.filter(p => {
            if (!p.size) return false;
            const productSizes = p.size.split(/[,-\s]+/).map(s => s.trim().toUpperCase());
            return productSizes.includes(size.toUpperCase());
        });
    }

    // Orden
    if (sort === 'asc') filtered.sort((a,b) => a.price - b.price);
    if (sort === 'desc') filtered.sort((a,b) => b.price - a.price);

    renderGrid(filtered);
}

function populateFilters() {
    const categories = new Set();
    const brands = new Set();
    const sizes = new Set();

    allProducts.forEach(p => {
        if(p.category && p.category !== "General") categories.add(p.category);
        if(p.brand && p.brand !== "Generica") brands.add(p.brand);
        
        if(p.size && p.size !== "Unitalla") {
            // Separa tallas por comas, guiones o espacios para leerlas individualmente
            const productSizes = p.size.split(/[,-\s]+/).map(s => s.trim().toUpperCase()).filter(s => s);
            productSizes.forEach(s => sizes.add(s));
        }
    });

    const buildOptions = (set, defaultText) => {
        let html = `<option value="">${defaultText}</option>`;
        Array.from(set).sort().forEach(item => {
            html += `<option value="${item}">${item}</option>`;
        });
        return html;
    };

    document.getElementById('filter-category').innerHTML = buildOptions(categories, "Artículos (Todos)");
    document.getElementById('filter-brand').innerHTML = buildOptions(brands, "Marcas (Todas)");
    document.getElementById('filter-size').innerHTML = buildOptions(sizes, "Tallas (Todas)");

    // Añadir lístener a todos para cambios
    document.getElementById('filter-category').addEventListener('change', processFilters);
    document.getElementById('filter-brand').addEventListener('change', processFilters);
    document.getElementById('filter-size').addEventListener('change', processFilters);
    document.getElementById('sort-price').addEventListener('change', processFilters);
}

function renderGrid(productsToRender) {
    const grid = document.getElementById("product-grid");
    grid.innerHTML = ""; // Limpiar grid

    if (productsToRender.length === 0) {
        grid.innerHTML = "<p style='color: var(--text-secondary); grid-column: 1 / -1; text-align: center; padding: 40px;'>No hay productos que coincidan con tus filtros.</p>";
        return;
    }

    productsToRender.forEach(product => {
        const isOutOfStock = product.quantity <= 0;
        const images = product.imageUrls || [product.imageUrl];
        let imagesHTML = "";
        images.forEach((img) => {
            imagesHTML += `<img src="${img}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/300?text=IMG'">`;
        });

        let productSizes = ['Unitalla'];
        if (product.size && product.size !== 'Unitalla') {
            productSizes = product.size.split(/[,-\s]+/).map(s => s.trim().toUpperCase()).filter(s => s);
        }

        const card = document.createElement("div");
        card.className = "ios-card";
        card.innerHTML = `
            <div class="image-scroller">
                ${imagesHTML}
            </div>
            ${images.length > 1 ? '<p style="text-align:center; font-size:11px; color:var(--text-secondary); margin-top:6px; margin-bottom:-4px;">Desliza para ver más ↔</p>' : ''}
            <div class="product-header">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-price">$${Number(product.price).toFixed(2)}</p>
            </div>
            <p style="font-size: 11px; color: #8E8E93; margin-top: 4px; margin-bottom: 2px;">
                ${product.category || 'N/A'} • ${product.brand || 'N/A'}
            </p>
            ${isOutOfStock ? 
                `<p class="product-stock out-of-stock" style="margin-top: 10px; margin-bottom: 10px;">Agotado</p>
                 <button class="ios-btn disabled" style="background:#E5E5EA; color:#8E8E93; margin-top:0;">No disponible</button>` 
               : 
                `
                <select id="size-${product.id}" class="ios-select" style="width: 100%; margin-top: 10px; margin-bottom: 12px; padding: 12px;">
                    ${productSizes.map(s => `<option value="${s}">Talla: ${s}</option>`).join('')}
                </select>
                <button class="ios-btn" style="background-color: var(--apple-blue); color: white; display:flex; justify-content:center; align-items:center; margin-top:0;" onclick="addToCart('${product.id}', '${product.name.replace(/'/g, "\\'")}', ${product.price}, '${images[0]}', event)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                    Añadir al Carrito
                </button>
                `
            }
        `;
        grid.appendChild(card);
    });
}

// ==========================================
// Integración Carrito de Compras
// ==========================================
let cart = JSON.parse(localStorage.getItem('oa_cart')) || [];

function saveCart() {
    localStorage.setItem('oa_cart', JSON.stringify(cart));
    updateCartUI();
}

window.addToCart = function(id, name, price, img, event) {
    const sizeEl = document.getElementById(`size-${id}`);
    const size = sizeEl ? sizeEl.value : 'Unitalla';

    // Verify product exists in cart
    const existing = cart.find(item => item.id === id && item.size === size);
    if(existing) {
        existing.quantity++;
    } else {
        cart.push({ id, name, price, size, img, quantity: 1 });
    }
    
    saveCart();

    // Feedback visual en el botón
    const btn = event.currentTarget;
    const oldHtml = btn.innerHTML;
    const oldBg = btn.style.backgroundColor;
    btn.innerHTML = "✅ Añadido";
    btn.style.backgroundColor = "#34C759";
    setTimeout(() => {
        btn.innerHTML = oldHtml;
        btn.style.backgroundColor = oldBg;
    }, 1500);
};

window.toggleCart = function() {
    const modal = document.getElementById('cart-modal');
    modal.style.display = modal.style.display === "flex" ? "none" : "flex";
    if (modal.style.display === "flex") {
        updateCartUI();
    }
};

window.updateCartUI = function() {
    // Badge counter
    const badge = document.getElementById("cart-badge");
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if(badge) {
        badge.innerText = totalItems;
        badge.style.display = totalItems > 0 ? "flex" : "none";
    }

    // Modal List
    const container = document.getElementById("cart-items-container");
    const totalEl = document.getElementById("cart-total");
    if(!container) return;

    if(cart.length === 0) {
        container.innerHTML = "<p style='color: var(--text-secondary); text-align: center; padding: 30px;'>Tu carrito está vacío.</p>";
        totalEl.innerText = "$0.00";
        return;
    }

    let total = 0;
    container.innerHTML = cart.map((item, index) => {
        total += item.price * item.quantity;
        return `
            <div class="cart-item-row" style="display: flex; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #E5E5EA; padding-bottom: 12px;">
                <img src="${item.img}" style="width: 55px; height: 55px; object-fit: cover; border-radius: 8px; margin-right: 12px;">
                <div style="flex-grow: 1;">
                    <div style="font-weight: 600; font-size: 14px; line-height: 1.2; margin-bottom: 2px;">${item.name}</div>
                    <div style="font-size: 12px; color: var(--text-secondary);">Talla: ${item.size} • <strong style="color:var(--text-primary);">$${item.price.toFixed(2)}</strong></div>
                    <div style="display: flex; align-items: center; margin-top: 8px;">
                        <button onclick="changeCartQty(${index}, -1)" class="action-btn" style="width:26px; height:26px; font-size:16px; border:1px solid #E5E5EA; border-radius:6px; background:transparent; cursor:pointer;">-</button>
                        <span style="margin: 0 12px; font-size: 14px; font-weight: 600;">${item.quantity}</span>
                        <button onclick="changeCartQty(${index}, 1)" class="action-btn" style="width:26px; height:26px; font-size:14px; border:1px solid #E5E5EA; border-radius:6px; background:transparent; cursor:pointer;">+</button>
                    </div>
                </div>
                <button onclick="removeFromCart(${index})" style="background:none; border:none; color: var(--apple-red); font-size: 20px; cursor: pointer; padding: 10px;">🗑️</button>
            </div>
        `;
    }).join("");

    totalEl.innerText = `$${total.toFixed(2)}`;
};

window.changeCartQty = function(index, delta) {
    cart[index].quantity += delta;
    if(cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    saveCart();
};

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    saveCart();
};

window.clearCart = function() {
    if(confirm("¿Estás seguro de vaciar tu carrito?")) {
        cart = [];
        saveCart();
    }
};

document.addEventListener("DOMContentLoaded", () => {
    updateCartUI(); // Inicializar el globito del carrito
    renderCatalog();
    
    // Controlador de Compra
    const checkoutBtn = document.getElementById('checkout-btn');
    if(checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if(cart.length === 0) return alert("Tu carrito está vacío");
            
            let message = "¡Hola! Quisiera realizar el siguiente pedido:\n\n";
            let total = 0;
            
            cart.forEach(item => {
                const subtotal = item.price * item.quantity;
                total += subtotal;
                message += `▪️ ${item.quantity}x ${item.name} (Talla: ${item.size}) - $${subtotal.toFixed(2)}\n`;
            });
            
            message += `\n*TOTAL: $${total.toFixed(2)}*\n\n¿Tienen disponibilidad y cómo procedemos con el envío/pago?`;
            
            const encodedMessage = encodeURIComponent(message);
            window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`, '_blank');
        });
    }
});
