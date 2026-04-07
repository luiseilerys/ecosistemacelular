/**
 * @fileoverview Punto de entrada principal - Versión modular del ecosistema celular
 */

import { CFG } from './utils/constants.js';
import { Ecosystem } from './core/ecosystem.js';
import { UIManager } from './ui/ui-manager.js';

// ============================================================
//  ESTADO GLOBAL
// ============================================================
let ecosystem = null;
let ui = null;
let camera = { x: CFG.WS / 2, y: CFG.WS / 2, z: 0.6, tx: CFG.WS / 2, ty: CFG.WS / 2, tz: 0.6 };
let selectedCell = null;
let animationId = null;

// ============================================================
//  INICIALIZACIÓN
// ============================================================
function init() {
  // Crear ecosistema
  ecosystem = new Ecosystem();
  ecosystem.init();
  
  // Crear UI
  ui = new UIManager(ecosystem);
  ui.setupEcosystemCallbacks();
  
  // Configurar canvas
  setupCanvas();
  
  // Configurar eventos de entrada
  setupInputHandlers();
  
  // Iniciar loop
  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    
    update(dt);
    render();
    
    animationId = requestAnimationFrame(loop);
  }
  
  animationId = requestAnimationFrame(loop);
}

// ============================================================
//  CONFIGURACIÓN DEL CANVAS
// ============================================================
function setupCanvas() {
  const cvs = document.getElementById('gameCanvas');
  const d = Math.min(window.devicePixelRatio || 1, 2);
  cvs.width = window.innerWidth * d;
  cvs.height = window.innerHeight * d;
  cvs.style.width = window.innerWidth + 'px';
  cvs.style.height = window.innerHeight + 'px';
  
  // Configurar minimapa
  const mm = document.getElementById('minimap');
  mm.width = 110 * d;
  mm.height = 110 * d;
  mm.style.width = '110px';
  mm.style.height = '110px';
  
  window.addEventListener('resize', () => {
    cvs.width = window.innerWidth * d;
    cvs.height = window.innerHeight * d;
    cvs.style.width = window.innerWidth + 'px';
    cvs.style.height = window.innerHeight + 'px';
  });
}

// ============================================================
//  MANEJO DE ENTRADA
// ============================================================
function setupInputHandlers() {
  const cvs = document.getElementById('gameCanvas');
  let drag = false;
  let dragP = { x: 0, y: 0 };
  let camStart = { x: 0, y: 0 };
  let lastDist = 0;
  
  // Mouse
  cvs.addEventListener('mousedown', e => {
    drag = true;
    dragP = { x: e.clientX, y: e.clientY };
    camStart = { x: camera.tx, y: camera.ty };
  });
  
  cvs.addEventListener('mousemove', e => {
    if (!drag) return;
    camera.tx = camStart.x - (e.clientX - dragP.x) / camera.z;
    camera.ty = camStart.y - (e.clientY - dragP.y) / camera.z;
  });
  
  cvs.addEventListener('mouseup', e => {
    if (Math.hypot(e.clientX - dragP.x, e.clientY - dragP.y) < 10) {
      selectCell(e.clientX, e.clientY);
    }
    drag = false;
  });
  
  // Touch
  cvs.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      drag = true;
      dragP = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      camStart = { x: camera.tx, y: camera.ty };
    }
    if (e.touches.length === 2) {
      drag = false;
      lastDist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY
      );
    }
  }, { passive: false });
  
  cvs.addEventListener('touchmove', e => {
    e.preventDefault();
    if (e.touches.length === 2) {
      const d = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY
      );
      camera.tz = clamp(camera.tz * (d / lastDist), 0.15, 3);
      lastDist = d;
    }
    if (e.touches.length === 1 && drag) {
      camera.tx = camStart.x - (e.touches[0].clientX - dragP.x) / camera.z;
      camera.ty = camStart.y - (e.touches[0].clientY - dragP.y) / camera.z;
    }
  }, { passive: false });
  
  cvs.addEventListener('touchend', e => {
    if (e.changedTouches.length === 1 && e.touches.length === 0) {
      selectCell(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    }
    drag = false;
  });
  
  // Controles de zoom
  document.getElementById('zoom-in').onclick = () => {
    camera.tz = clamp(camera.tz * 1.3, 0.15, 3);
  };
  
  document.getElementById('zoom-out').onclick = () => {
    camera.tz = clamp(camera.tz / 1.3, 0.15, 3);
  };
  
  document.getElementById('zoom-follow').onclick = () => {
    if (selectedCell && !selectedCell.dead) {
      camera.tx = selectedCell.x;
      camera.ty = selectedCell.y;
      camera.tz = 1.2;
    }
  };
}

// ============================================================
//  SELECCIÓN DE CÉLULAS
// ============================================================
function selectCell(cx, cy) {
  const r = document.getElementById('gameCanvas').getBoundingClientRect();
  const wx = (cx - r.left - document.getElementById('gameCanvas').width / 2) / camera.z + camera.x;
  const wy = (cy - r.top - document.getElementById('gameCanvas').height / 2) / camera.z + camera.y;
  
  let best = null;
  let bd = 9999;
  
  for (const cell of ecosystem.cells) {
    if (cell.dead) continue;
    const d = dist(wx, wy, cell.x, cell.y);
    if (d < Math.max(cell.radius + 10, 25) && d < bd) {
      best = cell;
      bd = d;
    }
  }
  
  if (best) {
    selectedCell = best;
    ui.showGenome(best);
    camera.tx = best.x;
    camera.ty = best.y;
  } else {
    selectedCell = null;
    document.getElementById('genome-panel').classList.add('hidden');
  }
}

// ============================================================
//  ACTUALIZACIÓN
// ============================================================
function update(dt) {
  // Interpolar cámara
  camera.x += (camera.tx - camera.x) * 0.1;
  camera.y += (camera.ty - camera.y) * 0.1;
  camera.z += (camera.tz - camera.z) * 0.1;
  
  // Actualizar ecosistema
  ecosystem.update(dt);
  
  // Actualizar UI
  ui.updateStats();
}

// ============================================================
//  RENDERIZADO
// ============================================================
function render() {
  const cvs = document.getElementById('gameCanvas');
  const ctx = cvs.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  
  // Limpiar
  ctx.fillStyle = '#030306';
  ctx.fillRect(0, 0, cvs.width, cvs.height);
  
  // Aplicar cámara
  ctx.save();
  ctx.translate(cvs.width / (2 * dpr), cvs.height / (2 * dpr));
  ctx.scale(camera.z * dpr, camera.z * dpr);
  ctx.translate(-camera.x, -camera.y);
  
  // Renderizar ecosistema
  ecosystem.render(ctx);
  
  ctx.restore();
  
  // Renderizar minimapa
  const mmCtx = document.getElementById('minimap').getContext('2d');
  ui.renderMinimap(mmCtx, camera);
}

// ============================================================
//  UTILIDADES
// ============================================================
function dist(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// ============================================================
//  INICIAR APLICACIÓN
// ============================================================
window.addEventListener('DOMContentLoaded', init);
