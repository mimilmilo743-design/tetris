import { db } from './firebase_config.js';
import { 
    collection, addDoc, onSnapshot, query, orderBy, limit
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

const rankingListPC = document.getElementById('rankingListPC');
const rankingListMobile = document.getElementById('rankingListMobile');

let topScores = [];

// --- FIREBASE RANKING SUBSCRIPTION ---
try {
    if (db) {
        const scoresRef = collection(db, "scores");
        const q = query(scoresRef, orderBy("score", "desc"), limit(10));

        let isConnected = false;
        setTimeout(() => {
            if (!isConnected && rankingListPC) {
                const msg = "<div class='splash-loading' style='font-size:12px; margin-top:20px; color:var(--text);'>Ranking Local (Firebase desconectado)</div>";
                rankingListPC.innerHTML = msg;
                rankingListMobile.innerHTML = msg;
                renderRanking(); // Render local si falla firebase
            }
        }, 5000);

        onSnapshot(q, (snapshot) => {
            isConnected = true;
            topScores = [];
            snapshot.forEach((doc) => {
                topScores.push({ id: doc.id, ...doc.data() });
            });
            renderRanking();
        }, (error) => {
            console.warn("Error al obtener ranking de Firebase:", error);
            renderRanking(); // Fallback a local
        });
    } else {
        setTimeout(renderRanking, 500);
    }
} catch (e) {
    console.warn("Ranking Firebase deshabilitado.", e);
    setTimeout(renderRanking, 500);
}

// --- RENDER RANKING ---
function renderRanking() {
    let scoresToRender = topScores;

    // Fallback a LocalStorage si Firebase está vacío o falla
    if (scoresToRender.length === 0) {
        const localScores = JSON.parse(localStorage.getItem('galaxy_local_ranking') || '[]');
        scoresToRender = localScores;
    }

    if (scoresToRender.length === 0) {
        const emptyMsg = "<div style='text-align:center; color:var(--text-dim); margin-top:20px; font-size:12px;'>¡Sé el primero en entrar al ranking!</div>";
        if(rankingListPC) rankingListPC.innerHTML = emptyMsg;
        if(rankingListMobile) rankingListMobile.innerHTML = emptyMsg;
        return;
    }

    const currentNickname = localStorage.getItem('galaxy_nickname') || "";

    let html = "";
    scoresToRender.forEach((scoreObj, index) => {
        const isCurrent = (scoreObj.nickname === currentNickname) ? "current-player" : "";
        html += `
        <div class="ranking-row ${isCurrent}">
            <span>${index + 1}</span>
            <span>${escapeHTML(scoreObj.nickname)}</span>
            <span>${scoreObj.score}</span>
        </div>`;
    });

    if(rankingListPC) rankingListPC.innerHTML = html;
    if(rankingListMobile) rankingListMobile.innerHTML = html;
}

function escapeHTML(str) {
    if (!str) return "";
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// --- GLOBAL EXPORTS ---
window.GalaxyRanking = {
    saveScore: async function(score) {
        if (score <= 0) return false;
        
        const nickname = localStorage.getItem('galaxy_nickname');
        if (!nickname) return false;

        let isNewRecord = false;

        // Guardar Localmente
        let localScores = JSON.parse(localStorage.getItem('galaxy_local_ranking') || '[]');
        localScores.push({ nickname, score, createdAt: new Date().toISOString() });
        localScores.sort((a, b) => b.score - a.score);
        
        // Comprobar si entra al top 10 local
        if (localScores.findIndex(s => s.nickname === nickname && s.score === score) < 10) {
            isNewRecord = true;
        }

        if (localScores.length > 10) localScores = localScores.slice(0, 10);
        localStorage.setItem('galaxy_local_ranking', JSON.stringify(localScores));
        renderRanking();

        // Guardar en Firebase
        if (db) {
            try {
                await addDoc(collection(db, "scores"), {
                    nickname: nickname,
                    score: score,
                    createdAt: new Date().toISOString()
                });
                isNewRecord = true;
            } catch(e) {
                console.warn("No se pudo guardar en Firebase, guardado localmente.", e);
            }
        }
        
        return isNewRecord;
    }
};
