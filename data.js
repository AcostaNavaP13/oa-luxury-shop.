firebase.initializeApp({
  apiKey: "AIzaSyAK93hgItKQ3Hc0hQVeRIpoODCZoIzA-zQ",
  authDomain: "oa-shop-d26fc.firebaseapp.com",
  projectId: "oa-shop-d26fc",
  storageBucket: "oa-shop-d26fc.firebasestorage.app",
  messagingSenderId: "400060157479",
  appId: "1:400060157479:web:8a4abb8e75417d505cc802",
});

const db = firebase.firestore();

class Database {
    static async getSettings() {
        try {
            const doc = await db.collection("settings").doc("store").get();
            if (doc.exists) return doc.data();
            return { whatsapp: "6143382041" }; // Default
        } catch(e) { 
            console.error("Error al obtener config, usando local", e); 
            return { whatsapp: "6143382041" }; 
        }
    }

    static async saveSettings(settings) {
        await db.collection("settings").doc("store").set(settings, {merge: true});
    }

    static async getProducts() {
        try {
            const snapshot = await db.collection("products").get();
            const products = [];
            snapshot.forEach(doc => {
                products.push({ id: doc.id, ...doc.data() });
            });
            return products;
        } catch(e) {
            console.error("Error al obtener productos:", e);
            return [];
        }
    }

    static async addProduct(product) {
        const newProd = {
            name: product.name,
            price: product.price,
            quantity: product.quantity,
            imageUrls: product.imageUrls,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection("products").add(newProd);
    }

    static async updateProductInfo(id, newPrice, newQuantity) {
        await db.collection("products").doc(id).update({
            price: newPrice,
            quantity: newQuantity
        });
    }

    static async deleteProduct(id) {
        await db.collection("products").doc(id).delete();
    }
}
