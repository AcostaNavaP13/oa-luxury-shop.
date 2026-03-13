let WHATSAPP_NUMBER = "6143382041";

function generateWhatsAppLink(productName) {
    const message = `¡Hola! Estoy interesado en el producto: *${productName}*. ¿Aún tienen disponibilidad?`;
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
}

async function renderCatalog() {
    const grid = document.getElementById("product-grid");
    if (!grid) return;

    grid.innerHTML = "<div style='color: #8E8E93; text-align: center; grid-column: 1 / -1; padding: 40px;'>Conectando base de datos segura...</div>";

    try {
        const settings = await Database.getSettings();
        WHATSAPP_NUMBER = settings.whatsapp || "6143382041";
    
        const products = await Database.getProducts();
        grid.innerHTML = ""; // Limpiar grid

        if (products.length === 0) {
            grid.innerHTML = "<p style='color: var(--text-secondary); grid-column: 1 / -1; text-align: center'>No hay productos disponibles actualmente.</p>";
            return;
        }

        products.forEach(product => {
            const isOutOfStock = product.quantity <= 0;
            const images = product.imageUrls || [product.imageUrl];
            let imagesHTML = "";
            images.forEach((img) => {
                imagesHTML += `<img src="${img}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/300?text=IMG'">`;
            });

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
                <p class="product-stock ${isOutOfStock ? 'out-of-stock' : 'in-stock'}">
                    ${isOutOfStock ? 'Agotado' : `${product.quantity} disponibles`}
                </p>
                <a 
                    href="${isOutOfStock ? '#' : generateWhatsAppLink(product.name)}" 
                    target="${isOutOfStock ? '_self' : '_blank'}" 
                    class="ios-btn whatsapp-btn ${isOutOfStock ? 'disabled' : ''}"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; vertical-align: text-bottom;"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    Pedir por WhatsApp
                </a>
            `;
            grid.appendChild(card);
        });
    } catch(err) {
        grid.innerHTML = "<p style='color: red; grid-column: 1 / -1; text-align:center;'>Hubo un error al cargar los productos.</p>";
    } finally {
        // Ocultar pantalla de carga cuando termine (Incluso si hay error)
        const loader = document.getElementById("oa-loading");
        if(loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 500); // 500ms transition 
        }
    }
}

document.addEventListener("DOMContentLoaded", renderCatalog);
