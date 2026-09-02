import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";

// TODO: REEMPLAZA ESTO CON LA CONFIGURACIÓN DE TU PROYECTO FIREBASE
// Encontrarás esto en tu Consola de Firebase -> Configuración del Proyecto -> Tus aplicaciones (Web)
const firebaseConfig = {
 apiKey: "AIzaSyDV7n_wkecKUr9ks7dhxsQYlX1VOyW1fn0",
  authDomain: "galaxy-blocks.firebaseapp.com",
  projectId: "galaxy-blocks",
  storageBucket: "galaxy-blocks.firebasestorage.app",
  messagingSenderId: "755869524254",
  appId: "1:755869524254:web:3bdcbd87566f22738de90f"
};

let db = null;
let auth = null;

try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
} catch (e) {
    console.warn("Firebase falló al inicializar:", e);
}

export { db, auth };
