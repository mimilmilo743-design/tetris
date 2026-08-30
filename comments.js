import { db, auth } from './firebase_config.js';
import { 
    collection, addDoc, onSnapshot, query, orderBy, 
    serverTimestamp, doc, updateDoc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";

// --- REFERENCIAS DOM ---
const commentsFab = document.getElementById('commentsFab');
const commentsModal = document.getElementById('commentsModal');
const closeCommentsBtn = document.getElementById('closeCommentsBtn');
const commentsList = document.getElementById('commentsList');
const commentsStatus = document.getElementById('commentsStatus');
const commentName = document.getElementById('commentName');
const commentText = document.getElementById('commentText');
const sendCommentBtn = document.getElementById('sendCommentBtn');

const adminSecretBtn = document.getElementById('adminSecretBtn');
const adminLoginArea = document.getElementById('adminLoginArea');
const adminEmail = document.getElementById('adminEmail');
const adminPass = document.getElementById('adminPass');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');
const adminError = document.getElementById('adminError');

let isAdmin = false;
let currentComments = [];

// --- ABRIR / CERRAR MODAL ---
commentsFab.addEventListener('click', () => {
    commentsModal.classList.remove('hidden');
});

closeCommentsBtn.addEventListener('click', () => {
    commentsModal.classList.add('hidden');
});

// --- ADMIN LOGIN UI ---
adminSecretBtn.addEventListener('click', () => {
    adminLoginArea.classList.toggle('hidden');
});

// --- FIREBASE AUTH (Admin) ---
try {
    if (!auth) throw new Error("Firebase Auth no inicializado");
    onAuthStateChanged(auth, (user) => {
        if (user) {
            isAdmin = true;
            adminLoginBtn.style.display = 'none';
            adminLogoutBtn.style.display = 'inline-block';
            adminEmail.style.display = 'none';
            adminPass.style.display = 'none';
            adminError.style.color = '#33ff88';
            adminError.textContent = 'Autenticado como Admin';
        } else {
            isAdmin = false;
            adminLoginBtn.style.display = 'inline-block';
            adminLogoutBtn.style.display = 'none';
            adminEmail.style.display = 'inline-block';
            adminPass.style.display = 'inline-block';
            adminError.textContent = '';
        }
        renderComments(); // Re-render para mostrar/ocultar botones de admin
    });
} catch(e) { console.warn("Firebase Auth no configurado correctamente.", e.message); }

adminLoginBtn.addEventListener('click', () => {
    if (!auth) {
        adminError.textContent = 'Sistema de auth no disponible';
        return;
    }
    const email = adminEmail.value;
    const pass = adminPass.value;
    signInWithEmailAndPassword(auth, email, pass)
        .then(() => { adminError.textContent = ''; })
        .catch((error) => {
            adminError.style.color = 'var(--danger)';
            adminError.textContent = 'Error: ' + error.message;
        });
});

adminLogoutBtn.addEventListener('click', () => {
    if (auth) signOut(auth);
});

// --- FIREBASE FIRESTORE (Comentarios) ---
try {
    if (!db) throw new Error("Firestore no inicializado");
    const commentsRef = collection(db, "comments");
    const q = query(commentsRef, orderBy("timestamp", "desc"));

    let isConnected = false;
    setTimeout(() => {
        if (!isConnected && commentsStatus) {
            commentsStatus.textContent = "Firebase no responde. (Comprueba tu conexión o Reglas)";
            commentsStatus.style.color = 'var(--danger)';
        }
    }, 5000);

    onSnapshot(q, (snapshot) => {
        isConnected = true;
        if(commentsStatus) commentsStatus.style.display = 'none';
        currentComments = [];
        snapshot.forEach((docSnap) => {
            currentComments.push({ id: docSnap.id, ...docSnap.data() });
        });
        renderComments();
    }, (error) => {
        isConnected = true;
        console.error("Error al cargar comentarios:", error);
        if(commentsStatus) {
            commentsStatus.textContent = "Sin conexión (Verifica tus Reglas de Firestore)";
            commentsStatus.style.color = 'var(--danger)';
        }
    });
} catch (e) {
    if(commentsStatus) {
        commentsStatus.textContent = "Sin conexión con la Base de Datos.";
        commentsStatus.style.color = 'var(--danger)';
    }
    console.warn("Firestore no configurado correctamente.", e.message);
}

function renderComments() {
    // Mantener status si existe y hay error, sino limpiar.
    if(currentComments.length === 0) {
        commentsList.innerHTML = '<div style="text-align:center; opacity:0.5; margin-top:20px;">No hay transmisiones. Sé el primero.</div>';
        return;
    }
    
    commentsList.innerHTML = ''; // Limpiar lista
    
    currentComments.forEach(comment => {
        const div = document.createElement('div');
        div.className = 'comment-bubble';
        
        let dateStr = "Enviando...";
        if(comment.timestamp) {
            const d = comment.timestamp.toDate();
            dateStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        }

        let html = `
            <div class="c-header">
                <span class="c-name">${escapeHTML(comment.name || 'Anónimo')}</span>
                <span class="c-date">${dateStr}</span>
            </div>
            <div class="c-text">${escapeHTML(comment.text || '')}</div>
        `;

        if(comment.adminReply) {
            html += `
            <div class="admin-reply">
                <div class="r-header">
                    <span>👑 Galaxy Blocks</span>
                </div>
                <div class="r-text">${escapeHTML(comment.adminReply)}</div>
            </div>`;
        }

        if(isAdmin) {
            html += `
            <div class="admin-actions">
                <button class="reply-btn" onclick="window.replyComment('${comment.id}')">RESPONDER</button>
                <button onclick="window.deleteComment('${comment.id}')">ELIMINAR</button>
            </div>`;
        }

        div.innerHTML = html;
        commentsList.appendChild(div);
    });
}

sendCommentBtn.addEventListener('click', async () => {
    const name = commentName.value.trim();
    const text = commentText.value.trim();

    if(!name || !text) {
        alert("Por favor escribe tu apodo y un mensaje.");
        return;
    }
    if(!db) {
        alert("Base de datos no conectada. Revisa la configuración de Firebase.");
        return;
    }

    sendCommentBtn.disabled = true;
    sendCommentBtn.textContent = 'ENVIANDO...';

    try {
        const commentsRef = collection(db, "comments");
        await addDoc(commentsRef, {
            name: name,
            text: text,
            timestamp: serverTimestamp()
        });
        commentText.value = '';
    } catch(e) {
        alert("Error al enviar: " + e.message + "\n\n¿Configuraste Firebase y sus Reglas?");
    } finally {
        sendCommentBtn.disabled = false;
        sendCommentBtn.textContent = 'ENVIAR TRANSMISIÓN';
    }
});

// --- FUNCIONES GLOBALES PARA BOTONES DE ADMIN ---
// Las exportamos a window porque los botones se inyectan como HTML string
window.replyComment = async (id) => {
    if(!isAdmin) return;
    const reply = prompt("Escribe tu respuesta como Administrador (deja en blanco para borrar la respuesta actual):");
    if(reply !== null) {
        try {
            const commentDoc = doc(db, "comments", id);
            if (reply.trim() === '') {
                 await updateDoc(commentDoc, {
                     adminReply: null,
                     adminReplyTimestamp: null
                 });
            } else {
                 await updateDoc(commentDoc, {
                     adminReply: reply,
                     adminReplyTimestamp: serverTimestamp()
                 });
            }
        } catch(e) { alert("Error: " + e.message); }
    }
};

window.deleteComment = async (id) => {
    if(!isAdmin) return;
    if(confirm("¿Seguro que quieres eliminar esta transmisión?")) {
        try {
            const commentDoc = doc(db, "comments", id);
            await deleteDoc(commentDoc);
        } catch(e) { alert("Error: " + e.message); }
    }
};

function escapeHTML(str) {
    const p = document.createElement('p');
    p.appendChild(document.createTextNode(str));
    return p.innerHTML;
}
