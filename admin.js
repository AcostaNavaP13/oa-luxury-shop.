document.addEventListener("DOMContentLoaded", () => {
    
    const loginForm = document.getElementById("login-form");
    const loginSection = document.getElementById("login-section");
    const dashSection = document.getElementById("dashboard-section");
    const logoutBtn = document.getElementById("logout-btn");
    
    if (sessionStorage.getItem("admin_logged") === "true") {
        showDashboard();
    }

    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const pass = document.getElementById("password").value;
            if (pass === "Pruebas1234$") {
                sessionStorage.setItem("admin_logged", "true");
                showDashboard();
            } else {
                alert("Contraseña incorrecta. Acceso denegado.");
            }
        });
    }

    if(logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            sessionStorage.removeItem("admin_logged");
            location.reload();
        });
    }

    async function showDashboard() {
        if(loginSection) loginSection.style.display = "none";
        if(dashSection) dashSection.style.display = "block";
        
        try {
            const settings = await Database.getSettings();
            const whatsappInput = document.getElementById("whatsapp-number");
            if(whatsappInput) whatsappInput.value = settings.whatsapp;
            await renderAdminTable();
        } catch(e) {
            console.error(e);
            alert("Error conectando con la base de datos.");
        }
    }

    const settingsForm = document.getElementById("settings-form");
    if(settingsForm) {
        settingsForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            btn.innerText = "Guardando...";
            const newWhatsapp = document.getElementById("whatsapp-number").value;
            await Database.saveSettings({ whatsapp: newWhatsapp });
            btn.innerText = "Guardar WhatsApp";
            alert("Número de WhatsApp guardado en la nube.");
        });
    }

    const productForm = document.getElementById("product-form");
    if(productForm) {
        productForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const name = document.getElementById("prod-name").value;
            const price = parseFloat(document.getElementById("prod-price").value);
            const quantity = parseInt(document.getElementById("prod-qty").value, 10);
            const imageInput = document.getElementById("prod-image");

            const btn = e.target.querySelector('.primary-btn');

            if (imageInput.files && imageInput.files.length > 0) {
                if (imageInput.files.length > 3) {
                    alert("Por favor, selecciona como máximo 3 imágenes.");
                    return;
                }

                btn.innerText = "Subiendo archivo(s) a la nube...";
                btn.disabled = true;

                const imagePromises = Array.from(imageInput.files).map(file => {
                    return new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = function(event) {
                            const img = new Image();
                            img.onload = function() {
                                const canvas = document.createElement("canvas");
                                const MAX_WIDTH = 500;
                                const scaleSize = MAX_WIDTH / img.width;
                                canvas.width = MAX_WIDTH;
                                canvas.height = img.height * scaleSize;
                                
                                const ctx = canvas.getContext("2d");
                                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                                
                                resolve(canvas.toDataURL("image/jpeg", 0.65));
                            };
                            img.src = event.target.result;
                        };
                        reader.readAsDataURL(file);
                    });
                });

                try {
                    const imageUrls = await Promise.all(imagePromises);
                    await Database.addProduct({ name, price, quantity, imageUrls });
                    e.target.reset(); // Limpiar formulario
                    await renderAdminTable(); // Refrescar vista
                    alert("Producto registrado correctamente");
                } catch(err) {
                    console.error(err);
                    alert("Error subiendo el producto: " + err.message);
                } finally {
                    btn.innerText = "Guardar Producto";
                    btn.disabled = false;
                }
            }
        });
    }
});

async function renderAdminTable() {
    const listBody = document.getElementById("admin-product-list");
    if (!listBody) return;

    listBody.innerHTML = "<tr><td colspan='5' style='text-align:center; padding: 24px;'>Descargando artículos...</td></tr>";

    try {
        const products = await Database.getProducts();
        listBody.innerHTML = "";
        
        if(products.length === 0) {
             listBody.innerHTML = "<tr><td colspan='5' style='text-align:center; padding: 24px; color: #8e8e93'>Tu base de datos está vacía, no hay productos.</td></tr>";
             return;
        }

        products.forEach(p => {
            const tr = document.createElement("tr");

            const firstImage = p.imageUrls ? p.imageUrls[0] : (p.imageUrl || 'https://via.placeholder.com/50?text=IMG');

            tr.innerHTML = `
                <td><img src="${firstImage}" class="table-img" onerror="this.src='https://via.placeholder.com/50?text=IMG'"/></td>
                <td style="font-weight:600">${p.name}</td>
                <td>$<input type="number" step="0.01" value="${p.price}" class="ios-input" style="width:80px; margin:0; padding:8px" id="price-${p.id}" /></td>
                <td>
                    <input type="number" value="${p.quantity}" class="ios-input" style="width:70px; margin:0; padding:8px" id="stock-${p.id}" />
                </td>
                <td>
                    <button class="action-btn" style="background:#E5E5EA; color:#000; margin-bottom: 5px;" onclick="updateProductInfo('${p.id}', this)">Guardar</button>
                    <button class="action-btn btn-delete" onclick="deleteProduct('${p.id}')">Eliminar</button>
                </td>
            `;

            listBody.appendChild(tr);
        });
    } catch(err) {
        listBody.innerHTML = `<tr><td colspan='5' style='color:red;'>Error al cargar datos. Verifique los permisos de Firestore.</td></tr>`;
        console.error(err);
    }
}

window.deleteProduct = async function(id) {
    if(confirm("¿Estás seguro de eliminar permanentemente este producto de Firebase?")) {
        try {
            await Database.deleteProduct(id);
            await renderAdminTable();
        } catch(err) {
            alert("No se pudo eliminar el producto: " + err.message);
        }
    }
}

window.updateProductInfo = async function(id, btn) {
    const priceInput = document.getElementById(`price-${id}`);
    const stockInput = document.getElementById(`stock-${id}`);
    
    const newPrice = parseFloat(priceInput.value);
    const newStock = parseInt(stockInput.value, 10);
    
    if(btn) btn.innerText = "Modificando...";
    
    try {
        await Database.updateProductInfo(id, newPrice, newStock);
        alert("Nube Actualizada - Precio: $" + newPrice + " / Stock: " + newStock);
        if(btn) {
            btn.innerText = "Guardar";
            btn.style.backgroundColor = "#34C759";
            btn.style.color = "#fff";
            setTimeout(() => {
                btn.style.backgroundColor = "#E5E5EA";
                btn.style.color = "#000";
            }, 1000);
        }
    } catch(err) {
         if(btn) btn.innerText = "Guardar";
         alert("Hubo un error de sincronización: " + err.message);
    }
}
