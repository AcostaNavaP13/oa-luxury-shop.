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
            const card = document.createElement("div");
            card.className = "ios-card";
            card.innerHTML = `
                <img src="${product.imageUrl}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/300?text=IMG'">
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
                    Pedir por WhatsApp
                </a>
            `;
            grid.appendChild(card);
        });
    } catch(err) {
        grid.innerHTML = "<p style='color: red; grid-column: 1 / -1; text-align:center;'>Hubo un error al cargar los productos.</p>";
    }
}

document.addEventListener("DOMContentLoaded", renderCatalog);
