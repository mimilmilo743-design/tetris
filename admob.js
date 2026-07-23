/**
 * AdMob Manager Mock
 * Este archivo establece la estructura para la integración de Google AdMob.
 * Cuando el juego se empaquete para Android (ej. con Cordova o Capacitor),
 * estas funciones se enlazarán a los plugins reales de anuncios.
 */

const AdMobManager = {
    initialized: false,
    
    /**
     * Inicializa el SDK de anuncios.
     */
    initAds: function() {
        console.log("[AdMob] Inicializando SDK...");
        this.initialized = true;
    },

    /**
     * Muestra un banner publicitario en la parte inferior de la pantalla.
     */
    showBanner: function() {
        if (!this.initialized) return;
        console.log("[AdMob] Mostrando Banner en la parte inferior.");
        // El espacio ya está reservado en CSS (.ad-banner-placeholder)
        const placeholder = document.getElementById('adBannerPlaceholder');
        if (placeholder) {
            placeholder.style.display = 'block';
            placeholder.innerHTML = '<div style="color:#5b6b85; font-size:10px;">AD BANNER MOCK</div>';
        }
    },

    /**
     * Muestra un anuncio a pantalla completa (Interstitial).
     * @param {Function} onCloseCallback Callback que se ejecuta cuando el usuario cierra el anuncio.
     */
    showInterstitial: function(onCloseCallback) {
        if (!this.initialized) {
            if (onCloseCallback) onCloseCallback();
            return;
        }
        
        console.log("[AdMob] Solicitando Interstitial...");
        
        // Simulación del tiempo de carga y visualización del anuncio (1 segundo)
        setTimeout(() => {
            console.log("[AdMob] Interstitial cerrado por el usuario.");
            if (onCloseCallback) {
                onCloseCallback();
            }
        }, 1000);
    }
};
