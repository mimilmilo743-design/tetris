# Galaxy Blocks 1.0

Un moderno y optimizado juego de bloques de energía diseñado específicamente para dispositivos móviles Android, utilizando tecnologías web estándar (HTML5, CSS3, JS Vanilla) con rendimiento nativo a 60 FPS, listo para empaquetar con Capacitor.

## Características Principales

*   **Rendimiento Híbrido:** Usa aceleración por hardware CSS (GPU) para el fondo estelar y un sistema de redibujado inteligente en JS (CPU) que se desactiva en estado de inactividad, conservando la batería en dispositivos de gama baja.
*   **Controles Ergonómicos y DAS:** Sistema de auto-repetición (Delayed Auto Shift) nativo para móviles, replicando la fluidez del teclado físico.
*   **Estética Neón y Tema Claro/Oscuro:** Modos visuales con partículas generadas al eliminar líneas de energía.
*   **Estadísticas y Logros:** Almacenamiento local persistente del progreso del jugador.

---

## 🚀 Guía de Empaquetado y Publicación (Capacitor)

El proyecto está construido 100% con tecnologías web sin empaquetadores como Webpack ni frameworks externos. Esto permite empaquetarlo instantáneamente con Capacitor.

### 1. Inicializar Capacitor

Asegúrate de tener Node.js instalado en tu sistema. Luego, en la carpeta raíz del proyecto, ejecuta:

```bash
# Iniciar un proyecto NPM
npm init -y

# Instalar Capacitor core y CLI
npm i @capacitor/core
npm i -D @capacitor/cli

# Inicializar Capacitor (Te preguntará el App Name y Package ID)
# Sugerencia Name: Galaxy Blocks
# Sugerencia Package ID: com.tuempresa.galaxyblocks
npx cap init
```

### 2. Configurar la Carpeta Web

Abre el archivo generado `capacitor.config.json` y asegúrate de que el directorio web sea la carpeta actual (o donde se encuentren tus archivos HTML). Si tus archivos están en la raíz, cambia `"webDir": "www"` a `"webDir": "."`.

```json
{
  "appId": "com.tuempresa.galaxyblocks",
  "appName": "Galaxy Blocks",
  "webDir": ".",
  "bundledWebRuntime": false
}
```

### 3. Agregar y Construir la Plataforma Android

```bash
# Instalar el paquete de Android
npm i @capacitor/android

# Añadir la plataforma Android
npx cap add android

# Sincronizar los archivos web a la plataforma Android
npx cap sync android
```

### 4. Integración de Google AdMob (Real)

En nuestro archivo `admob.js` simulamos la API. Para incluir anuncios reales de Google AdMob:

1.  Instala el plugin oficial de la comunidad para AdMob:
    ```bash
    npm install @capacitor-community/admob
    npx cap sync
    ```
2.  Abre el código nativo de Android en Android Studio:
    ```bash
    npx cap open android
    ```
3.  En el archivo `AndroidManifest.xml` de Android Studio, añade tu `APPLICATION_ID` de AdMob (revisa la documentación oficial del plugin para agregarlo en `<meta-data>`).
4.  **Actualiza el archivo `admob.js`:**
    Reemplaza la simulación actual con las llamadas reales del plugin. 

Ejemplo simplificado para tu nuevo `admob.js`:
```javascript
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';

const AdMobManager = {
    initialized: false,
    
    initAds: async function() {
        await AdMob.initialize({ requestTrackingAuthorization: true });
        this.initialized = true;
    },

    showBanner: async function() {
        if (!this.initialized) return;
        // El id debe ser tu ID de bloque de banner real
        await AdMob.showBanner({
            adId: 'ca-app-pub-3940256099942544/6300978111', 
            adSize: BannerAdSize.BANNER,
            position: BannerAdPosition.BOTTOM_CENTER,
            margin: 0
        });
        document.getElementById('adBannerPlaceholder').style.display = 'block';
    },

    showInterstitial: async function(onCloseCallback) {
        if (!this.initialized) {
            if (onCloseCallback) onCloseCallback();
            return;
        }
        await AdMob.prepareInterstitial({ adId: 'ca-app-pub-3940256099942544/1033173712' });
        await AdMob.showInterstitial();
        // Nota: Para una app en producción debes suscribirte a los eventos onClose de AdMob
        // para llamar a onCloseCallback()
    }
};
// Exportarlo si usas módulos, o mantenerlo global dependiendo de tu compilación
```

### 5. Generar el Archivo Android App Bundle (.AAB)

Google Play ahora exige que las nuevas aplicaciones se suban en formato `.aab`. 

1.  Abre el proyecto en Android Studio:
    ```bash
    npx cap open android
    ```
2.  En el menú superior de Android Studio, selecciona **Build > Generate Signed Bundle / APK...**
3.  Selecciona **Android App Bundle** y presiona "Next".
4.  Selecciona (o crea) tu clave del almacén de claves (Keystore). Guarda celosamente las contraseñas que utilices aquí.
5.  Selecciona la variante **release**.
6.  Haz clic en **Finish**. Android Studio generará un archivo `app-release.aab` en la carpeta `android/app/release/`.

### 6. Publicar en Google Play Console

1.  Ve a [Google Play Console](https://play.google.com/console/) y crea una nueva aplicación.
2.  Sube el archivo `app-release.aab` en la sección **Producción**.
3.  Completa los formularios requeridos:
    *   Ficha de Play Store (Título, descripciones corta/larga, iconos 512x512, capturas de pantalla, gráfico de funciones).
    *   Clasificación de contenido y cuestionario.
    *   Audiencia objetivo (indica si está dirigido a menores).
    *   Política de Privacidad (debes alojarla en una web pública).
4.  ¡Envía a revisión! El proceso suele tomar entre 1 a 7 días hábiles.

---
*Desarrollado y optimizado por tu asistente IA.*
