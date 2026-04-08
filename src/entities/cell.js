/**
 * @fileoverview Clase Cell - Representa una célula con IA, genes y comportamiento autónomo
 */

import { CFG, GENES } from '../utils/constants.js';
import { dist, clamp, lerp, randomRange } from '../utils/helpers.js';
import { Personality } from '../ai/personality.js';
import { EpisodicMemory } from '../ai/memory.js';
import { QLearning } from '../ai/qlearning.js';
import { EmotionalState } from '../ai/emotional-state.js';
import { BeliefMap } from '../ai/belief-map.js';
import { NeuralCore } from '../ai/neural-core.js';
import { BehavioralPlanner } from '../ai/behavioral-planner.js';

export class Cell {
  /**
   * @param {number} x - Posición X inicial
   * @param {number} y - Posición Y inicial
   * @param {Object} [genes] - Genes heredados o aleatorios
   * @param {Cell} [parent] - Célula padre (para herencia)
   */
  constructor(x, y, genes = null, parent = null) {
    // Identificación
    this.id = Math.random().toString(36).substr(2, 9);
    this.generation = parent ? parent.generation + 1 : 1;
    this.age = 0;
    this.dead = false;
    this.type = 'cell';
    
    // Posición y movimiento
    this.x = x;
    this.y = y;
    this.vx = randomRange(-0.5, 0.5);
    this.vy = randomRange(-0.5, 0.5);
    this.angle = Math.random() * Math.PI * 2;
    
    // Morfología procedural (forma dinámica basada en genes, rol e IA)
    this.baseVertices = 6 + Math.floor(this.genes.size * 0.3); // Más tamaño = más vértices
    this.vertexOffsets = new Float32Array(this.baseVertices);
    this.noiseOffset = Math.random() * 1000; // Para animación procedural
    this.formFactor = this.calculateFormFactor(); // 0.3 (alargado) a 1.5 (irregular)
    this.rotationSpeed = (this.genes.speed - 5) * 0.002; // Velocidad afecta rotación
    
    // Inicializar offsets basados en personalidad y rol
    for (let i = 0; i < this.baseVertices; i++) {
      const angle = (i / this.baseVertices) * Math.PI * 2;
      // Variación según agresividad (picos) y sociabilidad (suavidad)
      const aggressionMod = this.genes.aggression * 0.15;
      const socialMod = this.genes.sociability * 0.05;
      this.vertexOffsets[i] = (Math.sin(angle * 3 + this.noiseOffset) * aggressionMod) + 
                               (Math.cos(angle * 2) * socialMod) + 
                               randomRange(-0.05, 0.05);
    }
    
    // Genes (11 genes principales)
    this.genes = genes || this.generateGenes();
    
    // Derivados de genes
    this.radius = 8 + this.genes.size * 0.8;
    this.maxSpeed = 0.5 + this.genes.speed * 0.04;
    this.perceptionRadius = 50 + this.genes.senseRange * 3;
    
    // Energía
    this.energy = parent ? parent.energy * 0.4 : 80;
    this.maxEnergy = 150 + this.genes.size * 5;
    this.metabolism = CFG.MB + (this.genes.metabolism * 0.002);
    
    // Sistemas de IA
    this.personality = new Personality();
    this.memory = new EpisodicMemory(15);
    this.qLearning = new QLearning();
    this.emotions = new EmotionalState();
    this.beliefMap = new BeliefMap();
    this.neuralCore = new NeuralCore();
    this.planner = new BehavioralPlanner();
    
    // Estado conductual
    this.role = this.determineRole();
    this.state = 'wandering'; // wandering, seeking, fleeing, eating, reproducing, resting
    this.target = null;
    this.actionQueue = [];
    
    // Reproducción
    this.reproductionCooldown = 0;
    this.childrenCount = 0;
    
    // Colonias
    this.colonyId = null;
    this.colonyRole = null;
    
    // Render
    this.color = this.calculateColor();
    this.pulsePhase = Math.random() * Math.PI * 2;
    
    // Bioma actual
    this.currentBiome = null;
    
    // Registrar evento de nacimiento
    if (parent) {
      this.memory.add({
        type: 'birth',
        timestamp: 0,
        parentId: parent.id,
        location: { x, y }
      });
    }
  }

  /**
   * Genera genes aleatorios para una célula inicial
   * @returns {Object}
   */
  generateGenes() {
    const genes = {};
    for (const [name, config] of Object.entries(GENES)) {
      genes[name] = randomRange(config.n, config.x);
    }
    return genes;
  }

  /**
   * Determina el rol basado en genes y personalidad
   * @returns {string}
   */
  determineRole() {
    // Nota: this.emotions aún no está inicializado, usar valores por defecto
    const contentment = 0.5; // valor por defecto
    
    const scores = {
      explorer: this.genes.curiosity * 0.4 + this.personality.creativity * 0.3 + (1 - this.personality.caution) * 0.3,
      worker: this.genes.metabolism * 0.3 + this.personality.routine * 0.4 + this.genes.speed * 0.3,
      defender: this.genes.aggression * 0.4 + this.genes.defense * 0.3 + this.personality.stubbornness * 0.3,
      reproducer: this.genes.reproduction * 0.5 + contentment * 0.3 + this.personality.optimism * 0.2,
      signaler: this.genes.sociability * 0.5 + this.personality.empathy * 0.3 + (this.genes.senseRange || 0.5) * 0.2
    };
    
    return Object.entries(scores).reduce((a, b) => scores[a[0]] > scores[b[0]] ? a : b)[0];
  }

  /**
   * Calcula el color basado en genes y estado
   * @returns {string}
   */
  calculateColor() {
    const r = Math.floor(100 + this.genes.aggression * 1.5);
    const g = Math.floor(150 + this.genes.sociability * 0.8);
    const b = Math.floor(100 + this.genes.curiosity * 1.2);
    return `rgb(${r},${g},${b})`;
  }

  /**
   * Calcula el factor de forma basado en rol, entorno e IA
   * @returns {number} Factor entre 0.3 (alargado) y 1.5 (irregular)
   */
  calculateFormFactor() {
    let factor = 1.0;
    
    // Rol afecta forma
    switch(this.role) {
      case 'explorer': factor *= 0.8; break; // Más alargado para moverse rápido
      case 'defender': factor *= 1.4; break; // Más irregular/agresivo
      case 'worker': factor *= 0.9; break; // Compacto
      case 'reproducer': factor *= 1.1; break; // Redondeado
      case 'signaler': factor *= 1.2; break; // Con picos para señalizar
    }
    
    // Genes afectan forma
    factor += this.genes.aggression * 0.2; // Más agresivo = más picos
    factor -= this.genes.sociability * 0.1; // Más social = más suave
    factor += (this.genes.defense - 5) * 0.05; // Defensa añade irregularidad
    
    // Estado emocional afecta forma temporalmente
    if (this.emotions) {
      factor += this.emotions.stress * 0.1; // Estrés contrae
      factor += this.emotions.confidence * 0.05; // Confianza expande
    }
    
    return clamp(factor, 0.3, 1.5);
  }

  /**
   * Actualiza la morfología procedural dinámicamente
   * @param {number} dt - Delta time
   * @param {Object} biome - Bioma actual
   */
  updateMorphology(dt, biome) {
    const dtSec = dt / 1000;
    this.noiseOffset += dtSec * 0.5; // Animación lenta
    
    // Recalcular form factor según cambios de rol/estado
    const targetForm = this.calculateFormFactor();
    this.formFactor = lerp(this.formFactor, targetForm, dtSec * 0.5); // Transición suave
    
    // Actualizar offsets de vértices con noise procedural
    for (let i = 0; i < this.baseVertices; i++) {
      const angle = (i / this.baseVertices) * Math.PI * 2;
      
      // Noise basado en tiempo para animación orgánica
      const noise = Math.sin(angle * 3 + this.noiseOffset) * 0.02 +
                    Math.cos(angle * 5 + this.noiseOffset * 0.7) * 0.01;
      
      // Modificadores dinámicos
      const aggressionMod = this.genes.aggression * 0.15 * (1 + this.emotions.stress * 0.3);
      const socialMod = this.genes.sociability * 0.05;
      const biomeMod = biome ? biome.toxicity * 0.1 : 0; // Tóxico distorsiona
      
      // Objetivo de offset
      const targetOffset = (Math.sin(angle * 3 + this.noiseOffset) * aggressionMod) +
                           (Math.cos(angle * 2) * socialMod) +
                           noise +
                           biomeMod;
      
      // Interpolación suave
      this.vertexOffsets[i] = lerp(this.vertexOffsets[i], targetOffset, dtSec * 2);
    }
    
    // Rotación basada en velocidad y curiosidad
    this.angle += this.rotationSpeed * (1 + this.genes.curiosity * 0.2) * dtSec;
  }

  /**
   * Actualiza el estado de la célula
   * @param {number} dt - Delta time en ms
   * @param {Array<Cell>} cells - Todas las células
   * @param {Array<Food>} foods - Toda la comida
   * @param {Object} biomes - Sistema de biomas
   */
  update(dt, cells, foods, biomes) {
    if (this.dead) return;
    
    const dtSec = dt / 1000;
    this.age += dtSec;
    
    // Obtener bioma actual
    const currentBiome = biomes.getBiomeAt(this.x, this.y);
    this.currentBiome = currentBiome;
    
    // Actualizar morfología procedural (forma dinámica)
    this.updateMorphology(dt, currentBiome);
    
    // Actualizar emociones
    this.emotions.update(dtSec, this.energy / this.maxEnergy);
    
    // Actualizar cooldowns
    if (this.reproductionCooldown > 0) {
      this.reproductionCooldown -= dtSec;
    }
    
    // Metabolismo
    const biomePenalty = this.currentBiome && this.currentBiome.type === 'toxic' ? 1.5 : 1;
    this.energy -= this.metabolism * biomePenalty * dtSec;
    
    // Prevenir energía negativa
    if (this.energy < 0) {
      this.energy = 0;
    }
    
    // Muerte por energía
    if (this.energy <= 0) {
      this.die('starvation');
      return;
    }
    
    // Muerte por edad máxima
    const maxAge = 300 + (100 - this.genes.metabolism) * 2;
    if (this.age > maxAge) {
      this.energy -= 0.5 * dtSec;
      if (this.energy <= 0) {
        this.die('old_age');
        return;
      }
    }
    
    // Percepción
    const nearby = this.perceive(cells, foods);
    
    // Actualizar mapa de creencias
    this.beliefMap.update(this.x, this.y, nearby);
    
    // Tomar decisión
    this.decide(nearby, cells, foods, dtSec);
    
    // Ejecutar acción
    this.executeAction(dtSec);
    
    // Movimiento físico
    this.move(dtSec);
    
    // Actualizar bioma
    this.currentBiome = biomes.getBiomeAt(this.x, this.y);
    
    // Aprendizaje
    this.learn(dtSec);
  }

  /**
   * Detecta entidades cercanas
   * @param {Array<Cell>} cells 
   * @param {Array<Food>} foods 
   * @returns {Object}
   */
  perceive(cells, foods) {
    const nearbyCells = [];
    const nearbyFoods = [];
    const predators = [];
    const allies = [];
    
    for (const cell of cells) {
      if (cell === this || cell.dead) continue;
      
      const d = dist(this.x, this.y, cell.x, cell.y);
      if (d < this.perceptionRadius) {
        nearbyCells.push({ cell, distance: d });
        
        // Validar que genes exista antes de acceder
        if (cell.genes && cell.genes.aggression > 0.7 && cell.energy > this.energy * 1.2) {
          predators.push({ cell, distance: d });
        } else if (cell.colonyId === this.colonyId || (cell.genes && cell.genes.sociability > 0.6)) {
          allies.push({ cell, distance: d });
        }
      }
    }
    
    for (const food of foods) {
      if (food.dead) continue;
      
      const d = dist(this.x, this.y, food.x, food.y);
      if (d < this.perceptionRadius) {
        nearbyFoods.push({ food, distance: d });
      }
    }
    
    return { nearbyCells, nearbyFoods, predators, allies };
  }

  /**
   * Toma una decisión basada en IA
   * @param {Object} nearby 
   * @param {Array<Cell>} cells 
   * @param {Array<Food>} foods 
   * @param {number} dtSec
   */
  decide(nearby, cells, foods, dtSec) {
    // Entradas para la red neuronal
    const inputs = [
      this.energy / this.maxEnergy,
      nearby.predators.length > 0 ? 1 : 0,
      nearby.nearbyFoods.length / 10,
      nearby.allies.length / 5,
      this.emotions.stress,
      this.emotions.curiosity,
      this.personality.caution,
      this.personality.optimism
    ];
    
    // Procesar red neuronal
    const outputs = this.neuralCore.forward(inputs);
    
    // Planificador conductual
    if (this.actionQueue.length === 0 || this.planner.shouldReplan()) {
      const plan = this.planner.createPlan(this, nearby, outputs);
      this.actionQueue = plan;
    }
    
    // Obtener acción actual
    if (this.actionQueue.length > 0) {
      const action = this.actionQueue[0];
      this.state = action.type;
      this.target = action.target || null;
    } else {
      this.state = 'wandering';
      this.target = null;
    }
    
    // Registrar en memoria
    if (Math.random() < 0.01) {
      this.memory.add({
        type: 'decision',
        timestamp: this.age,
        state: this.state,
        energy: this.energy,
        location: { x: this.x, y: this.y }
      });
    }
  }

  /**
   * Ejecuta la acción actual
   * @param {number} dtSec
   */
  executeAction(dtSec) {
    switch (this.state) {
      case 'seeking_food':
        this.seekFood(dtSec);
        break;
      case 'fleeing':
        this.flee(dtSec);
        break;
      case 'eating':
        this.eat(dtSec);
        break;
      case 'reproducing':
        this.attemptReproduction(dtSec);
        break;
      case 'socializing':
        this.socialize(dtSec);
        break;
      case 'exploring':
        this.explore(dtSec);
        break;
      case 'resting':
        this.rest(dtSec);
        break;
      default:
        this.wander(dtSec);
    }
  }

  seekFood(dtSec) {
    if (!this.target || this.target.dead) {
      this.state = 'wandering';
      return;
    }
    
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const d = Math.hypot(dx, dy);
    
    if (d < this.radius + this.target.radius) {
      this.state = 'eating';
    } else {
      this.angle = Math.atan2(dy, dx);
      this.vx = Math.cos(this.angle) * this.maxSpeed;
      this.vy = Math.sin(this.angle) * this.maxSpeed;
    }
  }

  flee(dtSec) {
    if (!this.target || this.target.cell.dead) {
      this.state = 'wandering';
      return;
    }
    
    const dx = this.x - this.target.cell.x;
    const dy = this.y - this.target.cell.y;
    const d = Math.hypot(dx, dy);
    
    this.angle = Math.atan2(dy, dx);
    const speed = this.maxSpeed * (1 + this.emotions.stress * 0.5);
    this.vx = Math.cos(this.angle) * speed;
    this.vy = Math.sin(this.angle) * speed;
  }

  eat(dtSec) {
    if (!this.target || this.target.dead) {
      this.state = 'wandering';
      return;
    }
    
    const consumed = this.target.consume(5 * dtSec);
    this.energy += consumed * 0.8;
    this.emotions.modify('contentment', 0.02);
    
    if (this.target.dead) {
      this.state = 'wandering';
      this.target = null;
    }
  }

  attemptReproduction(dtSec) {
    if (this.reproductionCooldown > 0) {
      this.state = 'wandering';
      return;
    }
    
    if (this.energy < this.maxEnergy * 0.6) {
      this.state = 'seeking_food';
      return;
    }
    
    // Buscar pareja cercana
    // Simplificado para este ejemplo
    this.reproductionCooldown = 10;
    this.childrenCount++;
  }

  socialize(dtSec) {
    if (!this.target || this.target.cell.dead) {
      this.state = 'wandering';
      return;
    }
    
    const d = dist(this.x, this.y, this.target.cell.x, this.target.cell.y);
    if (d < 30) {
      this.emotions.modify('contentment', 0.01);
      this.vx *= 0.9;
      this.vy *= 0.9;
    } else {
      const dx = this.target.cell.x - this.x;
      const dy = this.target.cell.y - this.y;
      this.angle = Math.atan2(dy, dx);
      this.vx = Math.cos(this.angle) * this.maxSpeed * 0.5;
      this.vy = Math.sin(this.angle) * this.maxSpeed * 0.5;
    }
  }

  explore(dtSec) {
    this.emotions.modify('curiosity', 0.01);
    this.wander(dtSec);
  }

  rest(dtSec) {
    this.vx *= 0.95;
    this.vy *= 0.95;
    this.emotions.modify('stress', -0.02);
  }

  wander(dtSec) {
    // Movimiento aleatorio influenciado por personalidad
    const noise = (Math.random() - 0.5) * 0.1 * (1 + this.personality.creativity);
    this.angle += noise;
    
    const speed = this.maxSpeed * (0.3 + this.emotions.energy * 0.7);
    this.vx = Math.cos(this.angle) * speed;
    this.vy = Math.sin(this.angle) * speed;
  }

  /**
   * Aplica movimiento físico
   * @param {number} dtSec
   */
  move(dtSec) {
    // Aplicar velocidad
    this.x += this.vx * dtSec * 60;
    this.y += this.vy * dtSec * 60;
    
    // Límites del mundo
    this.x = clamp(this.x, 0, CFG.WS);
    this.y = clamp(this.y, 0, CFG.WS);
    
    // Fricción
    this.vx *= 0.99;
    this.vy *= 0.99;
  }

  /**
   * Aprende de experiencias recientes
   * @param {number} dtSec
   */
  learn(dtSec) {
    // Q-Learning: actualizar valores basados en recompensas
    const reward = this.emotions.contentment - this.emotions.stress;
    this.qLearning.update(reward);
    
    // Red neuronal: ajustar pesos
    if (Math.random() < this.genes.mutationRate * 0.1) {
      this.neuralCore.mutate(0.05);
    }
  }

  /**
   * Renderiza la célula
   * @param {CanvasRenderingContext2D} ctx
   * @param {boolean} debug - Modo depuración
   */
  render(ctx, debug = false) {
    this.pulsePhase += 0.05;
    const pulse = 1 + Math.sin(this.pulsePhase) * 0.05;

    // Guardar contexto para transformaciones
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Dibujar forma procedural con vértices dinámicos
    const scaledRadius = this.radius * pulse * this.formFactor;

    ctx.beginPath();
    for (let i = 0; i < this.baseVertices; i++) {
      const angle = (i / this.baseVertices) * Math.PI * 2;

      // Radio base + offset dinámico + escala por formFactor
      const vertexRadius = scaledRadius * (1 + this.vertexOffsets[i] * 2);
      const x = Math.cos(angle) * vertexRadius;
      const y = Math.sin(angle) * vertexRadius;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        // Curvas suaves entre vértices
        const prevAngle = ((i - 1) / this.baseVertices) * Math.PI * 2;
        const prevRadius = scaledRadius * (1 + this.vertexOffsets[i - 1] * 2);
        const cpX = Math.cos(prevAngle) * prevRadius * 0.8 + Math.cos(angle) * vertexRadius * 0.2;
        const cpY = Math.sin(prevAngle) * prevRadius * 0.8 + Math.sin(angle) * vertexRadius * 0.2;
        ctx.quadraticCurveTo(cpX, cpY, x, y);
      }
    }
    ctx.closePath();

    // Gradiente basado en energía y emociones
    const energyFactor = this.energy / this.maxEnergy;
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, scaledRadius * 1.2);

    // Color dinámico según estado emocional
    const r = Math.floor(100 + this.genes.aggression * 1.5 + this.emotions.stress * 30);
    const g = Math.floor(150 + this.genes.sociability * 0.8 - this.emotions.frustration * 20);
    const b = Math.floor(100 + this.genes.curiosity * 1.2 + this.emotions.curiosity * 25);
    const baseColor = `rgb(${r},${g},${b})`;

    gradient.addColorStop(0, baseColor);
    gradient.addColorStop(0.6, baseColor.replace('rgb', 'rgba').replace(')', `, ${0.7 + energyFactor * 0.3})`));
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');

    ctx.fillStyle = gradient;
    ctx.fill();

    // Borde brillante si hay estrés o confianza alta
    if (this.emotions.stress > 0.5 || this.emotions.confidence > 0.6) {
      ctx.strokeStyle = this.emotions.stress > 0.5 ? 'rgba(255, 100, 100, 0.6)' : 'rgba(100, 255, 100, 0.4)';
      ctx.lineWidth = 1 + (this.emotions.stress + this.emotions.confidence) * 2;
      ctx.stroke();
    }

    // Núcleo pulsante
    const nucleusSize = this.radius * 0.25 * (1 + Math.sin(this.pulsePhase * 2) * 0.2);
    ctx.beginPath();
    ctx.arc(0, 0, nucleusSize, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + energyFactor * 0.4})`;
    ctx.fill();

    // Restaurar contexto
    ctx.restore();

    // Indicador de dirección (fuera de la rotación)
    const arrowLen = this.radius * 1.5;
    const arrowX = this.x + Math.cos(this.angle) * arrowLen;
    const arrowY = this.y + Math.sin(this.angle) * arrowLen;

    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(arrowX, arrowY);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Barra de energía
    const energyPct = this.energy / this.maxEnergy;
    const barWidth = this.radius * 2;
    const barHeight = 3;
    const barX = this.x - barWidth / 2;
    const barY = this.y - this.radius - 8;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    const energyColor = energyPct > 0.5 ? '#69f0ae' : energyPct > 0.25 ? '#ffee58' : '#ef5350';
    ctx.fillStyle = energyColor;
    ctx.fillRect(barX, barY, barWidth * energyPct, barHeight);
    
    // Modo depuración
    if (debug) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.perceptionRadius, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '9px monospace';
      ctx.fillText(`${this.state}`, this.x - 15, this.y + this.radius + 12);
    }
  }

  /**
   * Marca la célula como muerta
   * @param {string} reason
   */
  die(reason) {
    this.dead = true;
    this.memory.add({
      type: 'death',
      timestamp: this.age,
      reason,
      location: { x: this.x, y: this.y }
    });
  }

  /**
   * Serializa la célula para guardado
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      genes: this.genes,
      energy: this.energy,
      age: this.age,
      generation: this.generation,
      personality: this.personality.toJSON(),
      memory: this.memory.toJSON(),
      qLearning: this.qLearning.toJSON(),
      emotions: this.emotions.toJSON(),
      neuralCore: this.neuralCore.toJSON(),
      role: this.role,
      colonyId: this.colonyId
    };
  }

  /**
   * Deserializa una célula desde JSON
   * @param {Object} data
   * @param {boolean} [isParent=false]
   * @returns {Cell}
   */
  static fromJSON(data, isParent = false) {
    const cell = new Cell(data.x, data.y, data.genes, isParent ? null : { generation: data.generation - 1 });
    
    cell.id = data.id;
    cell.energy = data.energy;
    cell.age = data.age;
    cell.generation = data.generation;
    cell.personality = Personality.fromJSON(data.personality);
    cell.memory = EpisodicMemory.fromJSON(data.memory);
    cell.qLearning = QLearning.fromJSON(data.qLearning);
    cell.emotions = EmotionalState.fromJSON(data.emotions);
    cell.neuralCore = NeuralCore.fromJSON(data.neuralCore);
    cell.role = data.role;
    cell.colonyId = data.colonyId;
    
    return cell;
  }
}
