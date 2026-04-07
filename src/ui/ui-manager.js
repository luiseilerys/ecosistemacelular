/**
 * @fileoverview UIManager - Gestiona la interfaz de usuario del ecosistema
 */

export class UIManager {
  constructor(ecosystem) {
    this.ecosystem = ecosystem;
    this.selectedCell = null;
    this.debugMode = false;
    this.logEntries = [];
    this.maxLogEntries = 50;
    
    // Elementos del DOM
    this.elements = {};
    this.initElements();
    this.bindEvents();
  }

  /**
   * Inicializa las referencias a elementos del DOM
   */
  initElements() {
    this.elements = {
      statCells: document.getElementById('stat-cells'),
      statFood: document.getElementById('stat-food'),
      statColonies: document.getElementById('stat-colonies'),
      maxGen: document.getElementById('max-gen'),
      speedSlider: document.getElementById('speed-slider'),
      speedValue: document.getElementById('speed-value'),
      debugBtn: document.getElementById('debug-btn'),
      logBtn: document.getElementById('btn-log'),
      pauseBtn: document.getElementById('btn-pause'),
      resetBtn: document.getElementById('btn-reset'),
      genomePanel: document.getElementById('genome-panel'),
      genomeContent: document.getElementById('genome-content'),
      closeGenome: document.getElementById('close-genome'),
      logPanel: document.getElementById('log-panel'),
      logContent: document.getElementById('log-content'),
      minimap: document.getElementById('minimap'),
      zoomIn: document.getElementById('zoom-in'),
      zoomOut: document.getElementById('zoom-out'),
      zoomFollow: document.getElementById('zoom-follow'),
      instructions: document.getElementById('instructions'),
      btnStart: document.getElementById('btn-start')
    };
  }

  /**
   * Vincula los eventos de la interfaz
   */
  bindEvents() {
    // Control de velocidad
    this.elements.speedSlider.addEventListener('input', (e) => {
      const value = e.target.value / 100;
      this.elements.speedValue.textContent = value.toFixed(1) + 'x';
      if (this.ecosystem) {
        this.ecosystem.speed = value;
      }
    });

    // Botón de depuración
    this.elements.debugBtn.addEventListener('click', () => {
      this.debugMode = !this.debugMode;
      this.elements.debugBtn.classList.toggle('active', this.debugMode);
      if (this.ecosystem) {
        this.ecosystem.debugMode = this.debugMode;
      }
    });

    // Botón de logs
    this.elements.logBtn.addEventListener('click', () => {
      const isVisible = this.elements.logPanel.style.display === 'block';
      this.elements.logPanel.style.display = isVisible ? 'none' : 'block';
      this.elements.logBtn.classList.toggle('active', !isVisible);
    });

    // Botón de pausa
    this.elements.pauseBtn.addEventListener('click', () => {
      if (this.ecosystem) {
        this.ecosystem.paused = !this.ecosystem.paused;
        this.elements.pauseBtn.textContent = this.ecosystem.paused ? '▶️' : '⏸️';
      }
    });

    // Botón de reinicio
    this.elements.resetBtn.addEventListener('click', () => {
      if (confirm('¿Reiniciar el ecosistema?')) {
        if (this.ecosystem) {
          this.ecosystem.reset();
        }
      }
    });

    // Cerrar panel de genoma
    this.elements.closeGenome.addEventListener('click', () => {
      this.elements.genomePanel.classList.add('hidden');
      this.selectedCell = null;
    });

    // Controles de zoom (se vinculan con el canvas en main.js)
    
    // Botón de inicio
    this.elements.btnStart.addEventListener('click', () => {
      this.elements.instructions.style.display = 'none';
    });
  }

  /**
   * Actualiza las estadísticas en la UI
   */
  updateStats() {
    if (!this.ecosystem) return;

    const stats = this.ecosystem.stats;
    this.elements.statCells.textContent = `🧬${stats.totalCells}`;
    this.elements.statFood.textContent = `🟢${stats.totalFood}`;
    this.elements.statColonies.textContent = `🏛️${stats.totalColonies}`;
    this.elements.maxGen.textContent = stats.maxGeneration;
  }

  /**
   * Muestra el panel de genoma de una célula
   * @param {Cell} cell 
   */
  showGenome(cell) {
    if (!cell) return;

    this.selectedCell = cell;
    this.elements.genomePanel.classList.remove('hidden');

    const genes = cell.genes;
    const geneConfig = [
      { name: 'speed', label: '⚡ Velocidad', color: '#ffee58' },
      { name: 'size', label: '📏 Tamaño', color: '#ef5350' },
      { name: 'perception', label: '👁️ Percepción', color: '#42a5f5' },
      { name: 'aggression', label: '⚔️ Agresividad', color: '#ab47bc' },
      { name: 'sociability', label: '🤝 Sociabilidad', color: '#26c6da' },
      { name: 'metabolism', label: '🔄 Metabolismo', color: '#ffa726' },
      { name: 'mutationRate', label: '🧬 Mutación', color: '#ec407a' },
      { name: 'reproduction', label: '💕 Reproducción', color: '#f06292' },
      { name: 'curiosity', label: '🔍 Curiosidad', color: '#ba68c8' },
      { name: 'defense', label: '🛡️ Defensa', color: '#90a4ae' },
      { name: 'patience', label: '⏳ Paciencia', color: '#a1887f' }
    ];

    let html = `
      <div class="section">
        <h4>📊 Información</h4>
        <div class="info-row"><span>ID:</span><span>${cell.id}</span></div>
        <div class="info-row"><span>Generación:</span><span>${cell.generation}</span></div>
        <div class="info-row"><span>Edad:</span><span>${cell.age.toFixed(1)}s</span></div>
        <div class="info-row"><span>Rol:</span><span>${cell.role}</span></div>
        <div class="info-row"><span>Estado:</span><span>${cell.state}</span></div>
      </div>
      
      <div class="section">
        <h4>🧬 Genes</h4>
        ${geneConfig.map(gene => `
          <div class="gene-row">
            <span class="gene-label">${gene.label}</span>
            <div class="gene-bar-bg">
              <div class="gene-bar" style="width:${genes[gene.name] * 100}%;background:${gene.color}"></div>
            </div>
            <span class="gene-val">${(genes[gene.name] * 100).toFixed(0)}%</span>
          </div>
        `).join('')}
      </div>
      
      <div class="section">
        <h4>😊 Emociones</h4>
        ${Object.entries(cell.emotions.states).map(([emotion, value]) => `
          <div style="margin:2px 0;font-size:9px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:1px;">
              <span>${emotion}</span>
              <span>${(value * 100).toFixed(0)}%</span>
            </div>
            <div class="emotion-bar">
              <div class="emotion-fill" style="width:${value * 100}%;background:${this.getEmotionColor(emotion)}"></div>
            </div>
          </div>
        `).join('')}
      </div>
      
      <div class="section">
        <h4>🧠 Personalidad</h4>
        ${Object.entries(cell.personality.traits).map(([trait, value]) => `
          <div class="info-row">
            <span>${trait}</span>
            <span>${(value * 100).toFixed(0)}%</span>
          </div>
        `).join('')}
      </div>
      
      <div class="section">
        <h4>⚡ Energía</h4>
        <div class="emotion-bar" style="height:8px;">
          <div class="emotion-fill" style="width:${(cell.energy / cell.maxEnergy) * 100}%;background:#69f0ae"></div>
        </div>
        <div class="info-row" style="margin-top:2px;">
          <span>${cell.energy.toFixed(1)} / ${cell.maxEnergy.toFixed(1)}</span>
        </div>
      </div>
    `;

    this.elements.genomeContent.innerHTML = html;
  }

  /**
   * Obtiene el color para una emoción
   * @param {string} emotion 
   * @returns {string}
   */
  getEmotionColor(emotion) {
    const colors = {
      energy: '#69f0ae',
      stress: '#ef5350',
      confidence: '#42a5f5',
      curiosity: '#ab47bc',
      frustration: '#ffa726',
      contentment: '#26c6da'
    };
    return colors[emotion] || '#80cbc4';
  }

  /**
   * Añade una entrada al log
   * @param {string} message 
   * @param {string} type 
   */
  addLog(message, type = 'info') {
    const entry = {
      message,
      type,
      timestamp: Date.now()
    };

    this.logEntries.push(entry);
    if (this.logEntries.length > this.maxLogEntries) {
      this.logEntries.shift();
    }

    this.renderLog();
  }

  /**
   * Renderiza el log
   */
  renderLog() {
    const html = this.logEntries.map(entry => 
      `<div class="log-entry ${entry.type}">[${new Date(entry.timestamp).toLocaleTimeString()}] ${entry.message}</div>`
    ).join('');

    this.elements.logContent.innerHTML = html;
    this.elements.logContent.scrollTop = this.elements.logContent.scrollHeight;
  }

  /**
   * Renderiza el minimapa
   * @param {CanvasRenderingContext2D} ctx 
   */
  renderMinimap(ctx, camera) {
    const size = 110;
    const scale = size / 4000;

    ctx.clearRect(0, 0, size, size);

    // Fondo
    ctx.fillStyle = 'rgba(10, 10, 18, 0.8)';
    ctx.fillRect(0, 0, size, size);

    // Comida (puntos verdes)
    ctx.fillStyle = 'rgba(76, 175, 80, 0.6)';
    for (const food of this.ecosystem.foods) {
      if (!food.dead) {
        ctx.beginPath();
        ctx.arc(food.x * scale, food.y * scale, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Células (puntos de colores)
    for (const cell of this.ecosystem.cells) {
      if (!cell.dead) {
        ctx.fillStyle = cell.color.replace('rgb', 'rgba').replace(')', ', 0.8)'));
        ctx.beginPath();
        ctx.arc(cell.x * scale, cell.y * scale, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Cámara (rectángulo blanco)
    const camX = (camera.x - 400 / camera.z / 2) * scale;
    const camY = (camera.y - 400 / camera.z / 2) * scale;
    const camW = (400 / camera.z) * scale;
    const camH = (400 / camera.z) * scale;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(camX, camY, camW, camH);

    // Célula seleccionada
    if (this.selectedCell && !this.selectedCell.dead) {
      ctx.strokeStyle = '#ff5252';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.selectedCell.x * scale, this.selectedCell.y * scale, 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  /**
   * Establece callbacks para eventos del ecosistema
   */
  setupEcosystemCallbacks() {
    if (!this.ecosystem) return;

    this.ecosystem.onCellBirth = (cell, parent) => {
      this.addLog(`Célula ${cell.id} nacida de ${parent.id}`, 'birth');
    };

    this.ecosystem.onCellDeath = (cell) => {
      if (this.selectedCell && this.selectedCell.id === cell.id) {
        this.elements.genomePanel.classList.add('hidden');
        this.selectedCell = null;
      }
      this.addLog(`Célula ${cell.id} murió`, 'death');
    };

    this.ecosystem.onColonyCreated = (colony) => {
      this.addLog(`Colonia ${colony.id} fundada`, 'colony');
    };
  }
}
