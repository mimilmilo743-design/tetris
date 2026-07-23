(function(){
  // --- ELEMENTOS DOM ---
  const boardCanvas = document.getElementById('board');
  const ctx = boardCanvas.getContext('2d');
  const nextCanvas = document.getElementById('next');
  const nctx = nextCanvas.getContext('2d');
  
  const overlay = document.getElementById('overlay');
  const startBtn = document.getElementById('startBtn');
  const scoreEl = document.getElementById('score');
  const levelEl = document.getElementById('level');
  const linesEl = document.getElementById('lines');
  const highScoreEl = document.getElementById('highScore');

  // Modals & UI
  const splashScreen = document.getElementById('splashScreen');
  const settingsModal = document.getElementById('settingsModal');
  const statsModal = document.getElementById('statsModal');
  const gameOverModal = document.getElementById('gameOverModal');
  
  const settingsBtn = document.getElementById('settingsBtn');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const statsBtn = document.getElementById('statsBtn');
  const closeStatsBtn = document.getElementById('closeStatsBtn');
  
  const resetDataBtn = document.getElementById('resetDataBtn');
  const playAgainBtn = document.getElementById('playAgainBtn');

  // Config Toggles
  const toggleTheme = document.getElementById('toggleTheme');
  const toggleMusic = document.getElementById('toggleMusic');
  const toggleSfx = document.getElementById('toggleSfx');
  const toggleVibration = document.getElementById('toggleVibration');

  // Game Over Stats
  const goScore = document.getElementById('goScore');
  const goLines = document.getElementById('goLines');
  const goHighScore = document.getElementById('goHighScore');

  // User Stats Elements
  const stGames = document.getElementById('stGames');
  const stLines = document.getElementById('stLines');
  const stTime = document.getElementById('stTime');
  const achievementsList = document.getElementById('achievementsList');

  // Touch controls
  const btnLeft = document.getElementById('btnLeft');
  const btnRight = document.getElementById('btnRight');
  const btnDown = document.getElementById('btnDown');
  const btnUp = document.getElementById('btnUp');
  const btnDrop = document.getElementById('btnDrop');

  // --- CONFIGURACIÓN Y PERSISTENCIA (localStorage) ---
  const DEFAULT_SETTINGS = { music: true, sfx: true, vibration: true, lightMode: false };
  let appSettings = { ...DEFAULT_SETTINGS };
  
  const DEFAULT_STATS = { games: 0, lines: 0, timeSecs: 0, bestScore: 0 };
  let appStats = { ...DEFAULT_STATS };
  
  let gameStartTime = 0;

  const ACHIEVEMENTS = [
    { id: 'first_game', name: 'Recluta Espacial', desc: 'Juega tu primera partida.', req: (s) => s.games >= 1 },
    { id: '100_lines', name: 'Centurión', desc: 'Destruye 100 líneas de energía.', req: (s) => s.lines >= 100 },
    { id: 'veteran', name: 'Veterano', desc: 'Juega más de 1 hora en total.', req: (s) => s.timeSecs >= 3600 },
    { id: 'high_score', name: 'Maestro Galáctico', desc: 'Alcanza los 10,000 puntos.', req: (s) => s.bestScore >= 10000 }
  ];

  function loadData() {
    try {
      const savedSett = localStorage.getItem('galaxySettings');
      if (savedSett) appSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSett) };
      
      const savedStats = localStorage.getItem('galaxyStats');
      if (savedStats) appStats = { ...DEFAULT_STATS, ...JSON.parse(savedStats) };
    } catch(e) { console.error("Error leyendo localStorage", e); }
    
    // Aplicar a la UI
    toggleTheme.checked = appSettings.lightMode;
    toggleMusic.checked = appSettings.music;
    toggleSfx.checked = appSettings.sfx;
    toggleVibration.checked = appSettings.vibration;
    highScoreEl.textContent = appStats.bestScore;
    
    applyTheme();
  }

  function saveData() {
    try { 
        localStorage.setItem('galaxySettings', JSON.stringify(appSettings)); 
        localStorage.setItem('galaxyStats', JSON.stringify(appStats));
    } catch(e){}
  }

  function updateSettingsFromUI() {
    appSettings.lightMode = toggleTheme.checked;
    appSettings.music = toggleMusic.checked;
    appSettings.sfx = toggleSfx.checked;
    appSettings.vibration = toggleVibration.checked;
    applyTheme();
    saveData();
    
    if (appSettings.music) {
        if (running && !paused && !gameOver) AudioEngine.playMusic();
    } else {
        AudioEngine.pauseMusic();
    }
  }

  function applyTheme() {
    if (appSettings.lightMode) {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
    } else {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
    }
    // Redibujar cache con nuevos colores
    initRenderCache();
    requestRedraw();
  }

  function checkHighScore(finalScore) {
    if (finalScore > appStats.bestScore) {
      appStats.bestScore = finalScore;
      highScoreEl.textContent = appStats.bestScore;
      return true;
    }
    return false;
  }
  
  function updateStatsUI() {
      stGames.textContent = appStats.games;
      stLines.textContent = appStats.lines;
      stTime.textContent = Math.floor(appStats.timeSecs / 60) + 'm';
      
      achievementsList.innerHTML = '';
      ACHIEVEMENTS.forEach(ach => {
          const unlocked = ach.req(appStats);
          const div = document.createElement('div');
          div.className = `achievement ${unlocked ? 'unlocked' : 'locked'}`;
          div.innerHTML = `<strong>${ach.name}</strong><br><span style="font-size:12px; opacity:0.8;">${ach.desc}</span>`;
          achievementsList.appendChild(div);
      });
  }

  function resetAllData() {
    if(confirm("¿Estás seguro de borrar todos tus datos, récords y logros de Galaxy Blocks?")) {
      try { 
          localStorage.removeItem('galaxySettings'); 
          localStorage.removeItem('galaxyStats'); 
      } catch(e){}
      appSettings = { ...DEFAULT_SETTINGS };
      appStats = { ...DEFAULT_STATS };
      loadData();
      alert("Datos borrados exitosamente.");
    }
  }

  // Eventos de Modales
  settingsBtn.addEventListener('click', () => {
    if(running && !paused && !gameOver) togglePause();
    settingsModal.classList.remove('hidden');
  });
  closeSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
  });
  
  statsBtn.addEventListener('click', () => {
    if(running && !paused && !gameOver) togglePause();
    updateStatsUI();
    statsModal.classList.remove('hidden');
  });
  closeStatsBtn.addEventListener('click', () => {
    statsModal.classList.add('hidden');
  });

  [toggleTheme, toggleMusic, toggleSfx, toggleVibration].forEach(t => t.addEventListener('change', updateSettingsFromUI));
  resetDataBtn.addEventListener('click', resetAllData);
  
  document.addEventListener('click', (e) => {
      if (e.target.closest('.btn') || e.target.closest('.icon-btn') || e.target.closest('.control-btn')) {
          AudioEngine.playSound('click');
      }
  });

  // --- SISTEMA DE AUDIO Y VIBRACIÓN ---
  const AudioEngine = {
    bgMusic: new Audio('assets/audio/fondo.mp3'),
    sfxFiles: {
      'inicio': 'assets/audio/inicio.mp3',
      'move': 'assets/audio/mover.mp3',
      'rotate': 'assets/audio/rotar.mp3',
      'drop': 'assets/audio/caida_rapida.mp3',
      'line': 'assets/audio/eliminar_una_linea.mp3',
      'level': 'assets/audio/subir_de_nivel.mp3',
      'highscore': 'assets/audio/nuevo_record.mp3',
      'gameover': 'assets/audio/game_over.mp3',
      'click': 'assets/audio/boton_de_menu.mp3'
    },
    sfxCache: {},
    targetVolume: 1.0,
    currentVolume: 1.0,
    volumeInterval: null,
    unduckTimer: null,
    isStoppingMusic: false,
    init: function() {
        this.bgMusic.loop = true;
        for (const [key, path] of Object.entries(this.sfxFiles)) {
            this.sfxCache[key] = new Audio(path);
        }
        // Bucle de transición suave de volumen
        this.volumeInterval = setInterval(() => {
            if (this.currentVolume !== this.targetVolume) {
                const step = 0.05;
                if (this.currentVolume < this.targetVolume) {
                    this.currentVolume = Math.min(this.targetVolume, this.currentVolume + step);
                } else {
                    this.currentVolume = Math.max(this.targetVolume, this.currentVolume - step);
                }
                this.bgMusic.volume = this.currentVolume;
            }
        }, 50);
    },
    playMusic: function() {
      if (!appSettings.music) {
          this.pauseMusic();
          return;
      }
      this.isStoppingMusic = false;
      this.targetVolume = 1.0;
      this.currentVolume = 1.0;
      this.bgMusic.volume = 1.0;
      this.bgMusic.play().catch(e => console.log("[Audio] Música bloqueada o no encontrada: " + e.message));
    },
    pauseMusic: function() { 
      this.bgMusic.pause(); 
    },
    stopMusic: function() {
      this.bgMusic.pause();
      this.bgMusic.currentTime = 0;
    },
    duck: function(duration, stopAfter) {
        if (!appSettings.music) return;
        this.targetVolume = 0.15; // Bajar volumen (Ducking)
        
        // Priorizar el stop de game_over por encima de otros sonidos simultáneos
        if (this.isStoppingMusic && !stopAfter) return; 
        if (stopAfter) this.isStoppingMusic = true;

        clearTimeout(this.unduckTimer);
        this.unduckTimer = setTimeout(() => {
            if (stopAfter || this.isStoppingMusic) {
                this.stopMusic();
                this.targetVolume = 1.0;
                this.currentVolume = 1.0;
                this.bgMusic.volume = 1.0;
                this.isStoppingMusic = false;
            } else {
                this.targetVolume = 1.0; // Restaurar volumen suavemente
            }
        }, duration);
    },
    playSound: function(type) {
      if (!appSettings.sfx || !this.sfxCache[type]) return;
      
      // Activar Ducking en eventos importantes
      if (['line', 'level', 'highscore', 'gameover'].includes(type)) {
          let duckDur = 1500; // Duración por defecto
          if (this.sfxCache[type].duration) duckDur = this.sfxCache[type].duration * 1000;
          this.duck(duckDur, type === 'gameover');
      }

      const sound = this.sfxCache[type].cloneNode();
      sound.play().catch(e => console.log(`[Audio] SFX ${type} bloqueado o no encontrado: ` + e.message));
    },
    vibrate: function(duration = 50) {
      if (!appSettings.vibration) return;
      if (navigator.vibrate) navigator.vibrate(duration);
    }
  };
  AudioEngine.init();

  // --- CONSTANTES DEL JUEGO ---
  const COLS = 10, ROWS = 20, CELL = 24;
  const COLORS = {
    I: getVar('--c-I'), O: getVar('--c-O'), T: getVar('--c-T'),
    S: getVar('--c-S'), Z: getVar('--c-Z'), J: getVar('--c-J'), L: getVar('--c-L')
  };
  function getVar(name){
    return getComputedStyle(document.body).getPropertyValue(name).trim();
  }
  const SHAPES = {
    I: [[0,1],[1,1],[2,1],[3,1]], O: [[1,0],[2,0],[1,1],[2,1]], T: [[1,0],[0,1],[1,1],[2,1]],
    S: [[1,0],[2,0],[0,1],[1,1]], Z: [[0,0],[1,0],[1,1],[2,1]], J: [[0,0],[0,1],[1,1],[2,1]], L: [[2,0],[0,1],[1,1],[2,1]]
  };
  const KEYS = Object.keys(SHAPES);

  let grid, current, next, score, level, lines, dropCounter, dropInterval, lastTime, running, paused, gameOver;
  let animId;
  let needsRedraw = true;

  function requestRedraw() { needsRedraw = true; }

  // --- MOTOR DE PARTÍCULAS HÍBRIDO ---
  const particles = [];
  function createParticles(yLine) {
      for(let x=0; x<COLS; x++) {
          if(!grid[yLine][x]) continue;
          const color = COLORS[grid[yLine][x]];
          for(let i=0; i<4; i++) {
              particles.push({
                  x: x * CELL + Math.random() * CELL,
                  y: yLine * CELL + Math.random() * CELL,
                  vx: (Math.random() - 0.5) * 6,
                  vy: (Math.random() - 0.5) * 6 - 2,
                  life: 1.0,
                  decay: Math.random() * 0.04 + 0.02,
                  color: color
              });
          }
      }
  }
  function updateParticles() {
      if(particles.length === 0) return;
      requestRedraw(); // Mantener dibujando a 60 FPS mientras vivan
      for(let i=particles.length-1; i>=0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= p.decay;
          if(p.life <= 0) {
              particles.splice(i, 1);
          }
      }
  }
  function drawParticles() {
      for(const p of particles) {
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x, p.y, 4, 4);
      }
      ctx.globalAlpha = 1;
  }

  // --- OPTIMIZACIÓN: Pre-render block canvases ---
  const blockCanvases = {};
  const bgCanvas = document.createElement('canvas');

  function initRenderCache() {
    // Actualizar colores para el tema actual
    const currentColors = {
      I: getVar('--c-I'), O: getVar('--c-O'), T: getVar('--c-T'),
      S: getVar('--c-S'), Z: getVar('--c-Z'), J: getVar('--c-J'), L: getVar('--c-L')
    };

    bgCanvas.width = boardCanvas.width;
    bgCanvas.height = boardCanvas.height;
    const bx = bgCanvas.getContext('2d');
    
    // Dejar fondo transparente para ver el paralaje CSS de estrellas
    bx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    
    bx.strokeStyle = getVar('--grid-line');
    bx.lineWidth = 1;
    for(let x = 0; x <= COLS; x++){
      bx.beginPath(); bx.moveTo(x * CELL, 0); bx.lineTo(x * CELL, ROWS * CELL); bx.stroke();
    }
    for(let y = 0; y <= ROWS; y++){
      bx.beginPath(); bx.moveTo(0, y * CELL); bx.lineTo(COLS * CELL, y * CELL); bx.stroke();
    }

    for(const key of KEYS) {
      const color = currentColors[key];
      const bc = document.createElement('canvas');
      bc.width = CELL;
      bc.height = CELL;
      const bcx = bc.getContext('2d');
      
      // Dibujar bloque estilo neón espacial
      bcx.fillStyle = color;
      bcx.fillRect(1, 1, CELL-2, CELL-2);
      
      // Brillos interiores
      bcx.fillStyle = 'rgba(255,255,255,0.4)';
      bcx.fillRect(1, 1, CELL-2, 2); // arriba
      bcx.fillRect(1, 1, 2, CELL-2); // izquierda
      
      bcx.fillStyle = 'rgba(0,0,0,0.4)';
      bcx.fillRect(1, CELL - 3, CELL-2, 2); // abajo
      bcx.fillRect(CELL - 3, 1, 2, CELL-2); // derecha
      
      blockCanvases[color] = bc;
      COLORS[key] = color; // sync
    }
  }

  function newGrid(){ return Array.from({length: ROWS}, () => Array(COLS).fill(null)); }

  function randomPiece(){
    const type = KEYS[Math.floor(Math.random()*KEYS.length)];
    const cells = SHAPES[type].map(c => ({x: c[0], y: c[1]}));
    return { type, cells, x: 3, y: -1, rot: 0 };
  }

  function rotateCells(cells, type){
    if(type === 'O') return cells.map(c => ({...c}));
    const size = type === 'I' ? 4 : 3;
    return cells.map(c => { return {x: size - 1 - y, y: c.x}; });
  }
  function rotateCellsCorrect(cells, type){
    if(type === 'O') return cells.map(c => ({...c}));
    const size = type === 'I' ? 4 : 3;
    return cells.map(c => ({x: size - 1 - c.y, y: c.x}));
  }

  function collides(cells, ox, oy){
    for(const c of cells){
      const x = c.x + ox, y = c.y + oy;
      if(x < 0 || x >= COLS || y >= ROWS) return true;
      if(y >= 0 && grid[y][x]) return true;
    }
    return false;
  }

  function merge(){
    for(const c of current.cells){
      const x = c.x + current.x, y = c.y + current.y;
      if(y >= 0) grid[y][x] = current.type;
    }
  }

  function clearLines(){
    let cleared = 0;
    outer:
    for(let y = ROWS - 1; y >= 0; y--){
      for(let x = 0; x < COLS; x++){
        if(!grid[y][x]) continue outer;
      }
      createParticles(y); // Estallido visual de partículas
      grid.splice(y, 1);
      grid.unshift(Array(COLS).fill(null));
      cleared++;
      y++;
    }
    
    if(cleared > 0){
      AudioEngine.playSound('line');
      AudioEngine.vibrate(100);
      
      // Sistema Clásico (Sin Combo)
      const points = [0, 100, 300, 500, 800][cleared] * level;
      score += points;
      lines += cleared;
      appStats.lines += cleared;
      saveData();
      
      const newLevel = Math.floor(lines / 10) + 1;
      if(newLevel !== level){
        level = newLevel;
        dropInterval = Math.max(100, 1000 - (level - 1) * 80);
        AudioEngine.playSound('level');
      }
      updateHUD();
      requestRedraw();
    } else {
      AudioEngine.playSound('drop');
      AudioEngine.vibrate(30);
    }
  }

  function spawn(){
    current = next;
    next = randomPiece();
    current.x = 3;
    current.y = -1;
    if(collides(current.cells, current.x, current.y)){
      handleGameOver();
    }
    drawNext();
    requestRedraw();
  }

  function move(dx){
    if(!collides(current.cells, current.x + dx, current.y)){
      current.x += dx;
      AudioEngine.playSound('move');
      requestRedraw();
    }
  }

  function softDrop(){
    if(!collides(current.cells, current.x, current.y + 1)){
      current.y += 1;
      score += 1;
      updateHUD();
      requestRedraw();
    } else {
      lockPiece();
    }
  }

  function hardDrop(){
    let dist = 0;
    while(!collides(current.cells, current.x, current.y + 1)){
      current.y += 1;
      dist++;
    }
    score += dist * 2;
    updateHUD();
    lockPiece();
  }

  function lockPiece(){
    merge();
    clearLines();
    spawn();
    dropCounter = 0;
    requestRedraw();
  }

  function rotate(){
    const rotated = rotateCellsCorrect(current.cells, current.type);
    const kicks = [0, -1, 1, -2, 2];
    for(const k of kicks){
      if(!collides(rotated, current.x + k, current.y)){
        current.cells = rotated;
        current.x += k;
        AudioEngine.playSound('rotate');
        requestRedraw();
        return;
      }
    }
  }

  function updateHUD(){
    scoreEl.textContent = score;
    levelEl.textContent = level;
    linesEl.textContent = lines;
  }

  function draw(){
    if(!needsRedraw) return;
    needsRedraw = false;

    // Limpiar canvas principal
    ctx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);
    
    // Fondo de cuadrícula
    ctx.drawImage(bgCanvas, 0, 0);

    for(let y = 0; y < ROWS; y++){
      for(let x = 0; x < COLS; x++){
        if(grid[y][x]) ctx.drawImage(blockCanvases[COLORS[grid[y][x]]], x * CELL, y * CELL);
      }
    }

    let ghostY = current.y;
    while(!collides(current.cells, current.x, ghostY + 1)) ghostY++;
    ctx.globalAlpha = 0.2;
    for(const c of current.cells){
      const x = c.x + current.x, y = c.y + ghostY;
      if(y >= 0) ctx.drawImage(blockCanvases[COLORS[current.type]], x * CELL, y * CELL);
    }
    ctx.globalAlpha = 1;

    for(const c of current.cells){
      const x = c.x + current.x, y = c.y + current.y;
      if(y >= 0) ctx.drawImage(blockCanvases[COLORS[current.type]], x * CELL, y * CELL);
    }
    
    drawParticles();
  }

  function drawNext(){
    nctx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    const size = 20;
    const cells = next.cells;
    const maxX = Math.max(...cells.map(c => c.x));
    const maxY = Math.max(...cells.map(c => c.y));
    const offX = (nextCanvas.width - (maxX + 1) * size) / 2;
    const offY = (nextCanvas.height - (maxY + 1) * size) / 2;
    for(const c of cells){
      nctx.drawImage(blockCanvases[COLORS[next.type]], offX + c.x * size, offY + c.y * size, size, size);
    }
  }

  function update(time = 0){
    if(!running || paused){ return; }
    let delta = time - lastTime;
    
    // Protección Capacitor/Android: Si el juego se va a segundo plano, el delta será enorme.
    // Limitamos el delta para evitar caídas bruscas.
    if(delta > 1000) delta = 16; 
    
    lastTime = time;
    dropCounter += delta;
    
    updateParticles();
    
    if(dropCounter > dropInterval){
      if(!collides(current.cells, current.x, current.y + 1)){
        current.y += 1;
        requestRedraw();
      } else {
        lockPiece();
      }
      dropCounter = 0;
    }
    draw();
    animId = requestAnimationFrame(update);
  }

  function startGame(){
    grid = newGrid();
    score = 0; level = 1; lines = 0;
    dropInterval = 1000;
    dropCounter = 0; lastTime = performance.now();
    
    // Estadísticas
    appStats.games++;
    gameStartTime = Date.now();
    saveData();
    
    next = randomPiece();
    spawn();
    updateHUD();
    
    running = true; paused = false; gameOver = false;
    overlay.classList.add('hidden');
    gameOverModal.classList.add('hidden');
    
    AudioEngine.playMusic();
    AudioEngine.playSound('inicio');
    
    cancelAnimationFrame(animId);
    particles.length = 0; // Limpiar partículas
    requestRedraw();
    animId = requestAnimationFrame(update);
  }

  function handleGameOver(){
    running = false; gameOver = true;
    cancelAnimationFrame(animId);
    
    // Acumular tiempo jugado
    appStats.timeSecs += Math.floor((Date.now() - gameStartTime) / 1000);
    
    AudioEngine.playSound('gameover');
    AudioEngine.vibrate(300);
    
    const isNewHigh = checkHighScore(score);
    if (isNewHigh && score > 0) AudioEngine.playSound('highscore');
    saveData();
    
    goScore.textContent = score;
    goLines.textContent = lines;
    goHighScore.textContent = appStats.bestScore;
    if (isNewHigh) goHighScore.style.color = '#33ff88';
    else goHighScore.style.color = 'var(--accent)';

    AdMobManager.showInterstitial(() => {
        gameOverModal.classList.remove('hidden');
    });

    requestRedraw();
    draw(); 
  }

  function togglePause(){
    if(!running && !paused) return; 
    if(gameOver) return;
    
    paused = !paused;
    if(paused){
      overlay.querySelector('h2').textContent = 'PAUSADO';
      overlay.querySelector('p').textContent = 'Misión detenida temporalmente.';
      startBtn.textContent = 'CONTINUAR';
      overlay.classList.remove('hidden');
      
      // Acumular tiempo parcial al pausar
      appStats.timeSecs += Math.floor((Date.now() - gameStartTime) / 1000);
      saveData();
      AudioEngine.pauseMusic();
    } else {
      overlay.classList.add('hidden');
      gameStartTime = Date.now(); // Reiniciar contador tras despausa
      lastTime = performance.now();
      requestRedraw();
      animId = requestAnimationFrame(update);
      AudioEngine.playMusic();
    }
  }

  startBtn.addEventListener('click', () => {
    if(paused){ togglePause(); return; }
    startGame();
  });
  playAgainBtn.addEventListener('click', startGame);

  document.addEventListener('keydown', (e) => {
    if(gameOver) return;
    if(e.code === 'KeyP'){ togglePause(); return; }
    if(!running || paused) return;
    switch(e.code){
      case 'ArrowLeft': move(-1); break;
      case 'ArrowRight': move(1); break;
      case 'ArrowDown': softDrop(); break;
      case 'ArrowUp': rotate(); break;
      case 'Space': e.preventDefault(); hardDrop(); break;
    }
  });

  // Setup Touch Controls
  let touchHoldTimer = null;
  let touchIntervalTimer = null;

  function clearTouchTimers() {
      clearTimeout(touchHoldTimer);
      clearInterval(touchIntervalTimer);
  }

  function setupTouchControls() {
    if (!btnLeft) return;

    const addTouch = (btn, action, enableRepeat = true) => {
        const handleStart = (e) => {
            e.preventDefault(); 
            if(!running || paused || gameOver) return;
            
            action();
            
            if(enableRepeat) {
              clearTouchTimers();
              touchHoldTimer = setTimeout(() => {
                  touchIntervalTimer = setInterval(() => {
                      if(!running || paused || gameOver) {
                          clearTouchTimers();
                          return;
                      }
                      action();
                  }, 50); 
              }, 250); 
            }
        };
        
        btn.addEventListener('touchstart', handleStart, {passive: false});
        btn.addEventListener('mousedown', handleStart);
    };
    
    const handleEnd = (e) => { e.preventDefault(); clearTouchTimers(); };
    [btnLeft, btnRight, btnDown, btnUp, btnDrop].forEach(btn => {
        btn.addEventListener('touchend', handleEnd, {passive: false});
        btn.addEventListener('touchcancel', handleEnd, {passive: false});
        btn.addEventListener('mouseup', handleEnd);
        btn.addEventListener('mouseleave', handleEnd);
    });

    addTouch(btnLeft, () => move(-1), true);
    addTouch(btnRight, () => move(1), true);
    addTouch(btnDown, softDrop, true);
    addTouch(btnUp, rotate, false); 
    addTouch(btnDrop, hardDrop, false);
  }

  // --- PROTECCIÓN ANDROID (Capacitor) ---
  // Pausar automáticamente si el usuario minimiza la aplicación o recibe una llamada
  document.addEventListener('visibilitychange', () => {
      if (document.hidden && running && !paused && !gameOver) {
          togglePause();
      }
  });

  // --- BOOTSTRAP ---
  loadData();
  initRenderCache();
  setupTouchControls();

  grid = newGrid();
  current = randomPiece();
  next = randomPiece();
  requestRedraw();
  draw();
  drawNext();

  setTimeout(() => {
      splashScreen.classList.add('fade-out');
      AdMobManager.initAds();
      AdMobManager.showBanner();
  }, 2000);

})();
