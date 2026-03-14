const ICON_SAVE = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>`;
const ICON_PHOTO = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`;
const ICON_TRASH = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;
const ICON_WAIT = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>`;
const ICON_CHECK = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

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
            
            const category = document.getElementById("prod-category").value;
            const brand = document.getElementById("prod-brand").value;
            const size = document.getElementById("prod-size").value;

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
                    await Database.addProduct({ name, price, quantity, category, brand, size, imageUrls });
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

    const csvForm = document.getElementById("csv-form");
    if (csvForm) {
        csvForm.addEventListener("submit", async(e) => {
            e.preventDefault();
            const fileInput = document.getElementById("csv-file");
            if (!fileInput.files || !fileInput.files[0]) return;
            
            const btn = e.target.querySelector("button[type=submit]");
            btn.innerText = "Procesando productos...";
            btn.disabled = true;

            const reader = new FileReader();
            reader.onload = async function(event) {
                const text = event.target.result;
                const rows = text.split('\n');
                let count = 0;
                
                // Empezar desde i=1 para evitar los nombres de las columnas
                for(let i = 1; i < rows.length; i++) {
                    const line = rows[i].trim();
                    if (!line) continue;
                    const row = line.split(',');
                    // Tiene que tener 6 columnas minimo
                    if (row.length >= 6) {
                        const name = row[0].trim();
                        const price = parseFloat(row[1]);
                        const qty = parseInt(row[2], 10);
                        const category = row[3].trim();
                        const brand = row[4].trim();
                        const size = row[5].trim();
                        
                        if (name && !isNaN(price) && !isNaN(qty)) {
                            await Database.addProduct({ name, price, quantity: qty, category, brand, size, imageUrls: [] });
                            count++;
                        }
                    } else if (row.length >= 3) {
                        // Soporte para el CSV antiguo de 3 columnas
                        const name = row[0].trim();
                        const price = parseFloat(row[1]);
                        const qty = parseInt(row[2], 10);
                        if (name && !isNaN(price) && !isNaN(qty)) {
                            await Database.addProduct({ name, price, quantity: qty, category: "General", brand: "Generica", size: "Unitalla", imageUrls: [] });
                            count++;
                        }
                    }
                }
                
                alert(`¡Éxito! Se importaron ${count} productos correctamente. Ahora puedes subir sus fotos desde la tabla.`);
                btn.innerText = "Cargar .CSV";
                btn.disabled = false;
                csvForm.reset();
                await renderAdminTable();
            };
            reader.readAsText(fileInput.files[0]);
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
                <td>
                    <div style="font-weight:600">${p.name}</div>
                    <div style="font-size:11px; color:#8E8E93; margin-top:2px;">
                        ${p.category || 'N/A'} • ${p.brand || 'N/A'} • Talla: ${p.size || 'N/A'}
                    </div>
                </td>
                <td>$<input type="number" step="0.01" value="${p.price}" class="ios-input" style="width:80px; margin:0; padding:8px" id="price-${p.id}" /></td>
                <td>
                    <input type="number" value="${p.quantity}" class="ios-input" style="width:70px; margin:0; padding:8px" id="stock-${p.id}" />
                </td>
                <td style="white-space: nowrap;">
                    <button class="action-btn" onclick="updateProductInfo('${p.id}', this)" title="Guardar cambios de Precio/Stock">${ICON_SAVE}</button>
                    <button class="action-btn" onclick="openImageModal('${p.id}', '${p.name}')" title="Gestionar Fotos">${ICON_PHOTO}</button>
                    <button class="action-btn btn-delete" onclick="deleteProduct('${p.id}')" title="Eliminar Producto">${ICON_TRASH}</button>
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
    
    if(btn) btn.innerHTML = ICON_WAIT;
    
    try {
        await Database.updateProductInfo(id, newPrice, newStock);
        if(btn) {
            btn.innerHTML = ICON_CHECK;
            btn.style.color = "#34C759";
            btn.style.borderColor = "#34C759";
            setTimeout(() => {
                btn.innerHTML = ICON_SAVE;
                btn.style.color = "var(--text-primary)";
                btn.style.borderColor = "#E5E5EA";
            }, 1000);
        }
    } catch(err) {
         if(btn) btn.innerHTML = ICON_SAVE;
         alert("Hubo un error de sincronización: " + err.message);
    }
}

// ==========================================
// Image Management Modal Logic
// ==========================================
let currentProductId = null;
let currentImageUrls = [];

window.openImageModal = async function(id, name) {
    currentProductId = id;
    document.getElementById("modal-title").innerText = `Fotos: ${name}`;
    document.getElementById("image-modal").style.display = "flex";
    
    // Fetch product latest data
    try {
        const doc = await db.collection("products").doc(id).get();
        if(doc.exists) {
            currentImageUrls = doc.data().imageUrls || [];
            // Compatibilidad vieja
            if(currentImageUrls.length === 0 && doc.data().imageUrl) {
                currentImageUrls = [doc.data().imageUrl];
            }
            renderModalImages();
        }
    } catch(e) { console.error(e); }
};

window.closeImageModal = function() {
    document.getElementById("image-modal").style.display = "none";
    currentProductId = null;
    currentImageUrls = [];
    renderAdminTable(); // Refresh table to show visual changes
};

function renderModalImages() {
    const grid = document.getElementById("modal-images-grid");
    grid.innerHTML = "";
    
    if(currentImageUrls.length === 0) {
        grid.innerHTML = "<p style='color: var(--text-secondary); width: 100%;'>No hay fotos todavía.</p>";
        return;
    }

    currentImageUrls.forEach((url, index) => {
        const isPrimary = index === 0;
        const wrapper = document.createElement("div");
        wrapper.className = `modal-img-wrapper ${isPrimary ? 'primary' : ''}`;
        
        wrapper.innerHTML = `
            <img src="${url}">
            <div class="modal-img-actions">
                ${!isPrimary ? `<button onclick="makeImagePrimary(${index})" title="Hacer Principal">⭐</button>` : `<span style="color:#34C759; font-size:14px; padding-top:2px;">Principal</span>`}
                <button onclick="deleteImageFromList(${index})" title="Eliminar">🗑️</button>
            </div>
        `;
        grid.appendChild(wrapper);
    });
}

window.makeImagePrimary = async function(index) {
    const imgUrl = currentImageUrls.splice(index, 1)[0];
    currentImageUrls.unshift(imgUrl); // Move to front
    
    renderModalImages();
    await Database.updateProductImages(currentProductId, currentImageUrls);
};

window.deleteImageFromList = async function(index) {
    if(!confirm("¿Borrar esta foto?")) return;
    
    currentImageUrls.splice(index, 1);
    renderModalImages();
    await Database.updateProductImages(currentProductId, currentImageUrls);
};

// Handle uploading new images from inside the modal
document.addEventListener("DOMContentLoaded", () => {
    const modalFileInput = document.getElementById("modal-file-input");
    if(modalFileInput) {
        modalFileInput.addEventListener("change", async (e) => {
            const files = e.target.files;
            if(!files || files.length === 0) return;
            
            const remainingSlots = 3 - currentImageUrls.length;
            if(files.length > remainingSlots) {
                alert(`Sólo puedes subir ${remainingSlots} imagen(es) más. Límite de 3 total.`);
                e.target.value = "";
                return;
            }

            // Cambiar UI
            const labelBtn = modalFileInput.parentElement;
            const originalText = labelBtn.innerHTML;
            labelBtn.style.pointerEvents = "none";
            labelBtn.innerHTML = "⏳ Subiendo y comprimiendo...";

            const imagePromises = Array.from(files).map(file => {
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
                const newUrls = await Promise.all(imagePromises);
                currentImageUrls = currentImageUrls.concat(newUrls);
                
                await Database.updateProductImages(currentProductId, currentImageUrls);
                renderModalImages();
                e.target.value = ""; // reset
            } catch(err) {
                alert("Error: " + err.message);
            } finally {
                labelBtn.style.pointerEvents = "auto";
                labelBtn.innerHTML = originalText;
            }
        });
    }
});
