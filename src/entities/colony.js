/**
 * @fileoverview Clase Colony - Representa un organismo multicelular formado por células unidas físicamente.
 * Coordina roles, recursos compartidos y comportamiento colectivo como un solo ser vivo.
 */

import { dist } from '../utils/helpers.js';

export class Colony {
  /**
   * @param {string} id - Identificador único
   * @param {Cell} founder - Célula fundadora
   * @param {number} x - Posición X del centro
   * @param {number} y - Posición Y del centro
   */
  constructor(id, founder, x, y) {
    this.id = id;
    this.founderId = founder.id;
    this.x = x;
    this.y = y;
    this.radius = 25; // Radio inicial más pequeño
    this.cells = [founder]; // Array físico de células (no solo IDs)
    founder.colonyId = id;
    founder.inColony = true;
    this.created = Date.now();
    this.population = 1;
    this.maxPopulation = 20;
    this.resources = 0;
    this.defenseLevel = 0;
    this.expansionRate = 0.1;
    
    // Estado del organismo
    this.targetX = x;
    this.targetY = y;
    this.state = 'idle'; // idle, moving, feeding, defending, reproducing
    this.velocityX = 0;
    this.velocityY = 0;
    
    // Roles dentro del organismo (referencias físicas a células)
    this.roles = {
      brain: null,      // Decide hacia dónde moverse
      stomach: null,    // Digiere comida para todo el organismo
      muscle: null,     // Proporciona movimiento
      defender: null,   // Protege de amenazas
      worker: null      // Recolecta recursos
    };
    
    // Asignar rol inicial al fundador
    this.assignRole(founder);
    
    // Feromonas del organismo
    this.pheromones = [];
    
    // Color basado en el fundador
    this.color = founder.color;
  }

  /**
   * Añade una célula físicamente al organismo (se pega al lado)
   * @param {Cell} cell 
   */
  addMember(cell) {
    if (this.cells.includes(cell)) return;
    
    this.cells.push(cell);
    cell.colonyId = this.id;
    cell.inColony = true;
    this.population++;
    
    // Posicionar la nueva célula adyacente al organismo
    this.positionNewCell(cell);
    
    // Asignar rol basado en características de la célula
    this.assignRole(cell);
    
    // Recalcular centro de masa
    this.updateCenter();
    
    // Expandir radio si es necesario
    if (this.population > this.maxPopulation * 0.8) {
      this.radius += 5;
      this.maxPopulation += 5;
    }
  }

  /**
   * Posiciona una nueva célula adyacente al organismo existente
   * Las células se pegan una al lado de la otra formando un tejido
   */
  positionNewCell(cell) {
    // Encontrar posición libre adyacente al organismo
    const angle = Math.random() * Math.PI * 2;
    const distance = this.radius + cell.radius;
    
    cell.x = this.x + Math.cos(angle) * distance;
    cell.y = this.y + Math.sin(angle) * distance;
    
    // Verificar colisiones con otras células y ajustar
    let attempts = 0;
    while (attempts < 10) {
      let collision = false;
      for (const other of this.cells) {
        if (other !== cell) {
          const d = dist(cell.x, cell.y, other.x, other.y);
          if (d < cell.radius + other.radius - 2) { // -2 para que se toquen ligeramente
            collision = true;
            break;
          }
        }
      }
      
      if (!collision) break;
      
      // Intentar nueva posición
      const newAngle = Math.random() * Math.PI * 2;
      cell.x = this.x + Math.cos(newAngle) * distance;
      cell.y = this.y + Math.sin(newAngle) * distance;
      attempts++;
    }
  }

  /**
   * Actualiza el centro de masa del organismo basado en todas las células
   */
  updateCenter() {
    if (this.cells.length === 0) return;
    
    let sumX = 0, sumY = 0;
    for (const cell of this.cells) {
      sumX += cell.x;
      sumY += cell.y;
    }
    
    this.x = sumX / this.cells.length;
    this.y = sumY / this.cells.length;
    this.radius = Math.sqrt(this.cells.length) * 8;
  }

  /**
   * Asigna un rol específico a una célula basado en sus genes y estado
   * Roles: BRAIN (cerebro), STOMACH (estómago), MUSCLE (músculo), DEFENDER (defensor), WORKER (trabajador)
   * @param {Cell} cell 
   */
  assignRole(cell) {
    // Determinar aptitud para cada rol
    const scores = {
      brain: cell.genes.senseRange * 0.6 + cell.personality.intelligence * 0.4,
      stomach: cell.energy * 0.5 + cell.genes.metabolism * 0.3 + cell.personality.optimism * 0.2,
      muscle: cell.genes.speed * 0.7 + cell.genes.strength * 0.3,
      defender: cell.genes.aggression * 0.5 + cell.genes.defense * 0.5,
      worker: cell.genes.senseRange * 0.4 + cell.personality.conscientiousness * 0.3 + cell.energy * 0.3
    };
    
    // Asignar el mejor rol disponible
    let bestRole = 'worker';
    let bestScore = -1;
    
    for (const [role, score] of Object.entries(scores)) {
      // Si el rol está vacío o esta célula es mejor que la actual
      if (!this.roles[role] || score > this.getRoleScore(this.roles[role], role)) {
        if (score > bestScore) {
          bestScore = score;
          bestRole = role;
        }
      }
    }
    
    // Si hay alguien en ese rol, liberarlo
    if (this.roles[bestRole]) {
      const oldCell = this.roles[bestRole];
      oldCell.organRole = null;
      this.roles[bestRole] = null;
    }
    
    // Asignar nuevo rol
    this.roles[bestRole] = cell;
    cell.organRole = bestRole;
  }

  /**
   * Obtiene el score de una célula para un rol específico
   */
  getRoleScore(cell, role) {
    if (!cell) return -1;
    
    switch(role) {
      case 'brain': return cell.genes.senseRange * 0.6 + cell.personality.intelligence * 0.4;
      case 'stomach': return cell.energy * 0.5 + cell.genes.metabolism * 0.3;
      case 'muscle': return cell.genes.speed * 0.7 + cell.genes.strength * 0.3;
      case 'defender': return cell.genes.aggression * 0.5 + cell.genes.defense * 0.5;
      case 'worker': return cell.genes.senseRange * 0.4 + cell.energy * 0.3;
      default: return 0;
    }
  }

  /**
   * Remueve un miembro del organismo
   * @param {Cell} cell 
   */
  removeMember(cell) {
    const index = this.cells.indexOf(cell);
    if (index === -1) return;
    
    this.cells.splice(index, 1);
    cell.colonyId = null;
    cell.inColony = false;
    cell.organRole = null;
    this.population--;
    
    // Limpiar roles
    for (const role in this.roles) {
      if (this.roles[role] === cell) {
        this.roles[role] = null;
      }
    }
    
    // Reasignar roles si es necesario
    this.reassignRoles();
    
    // Actualizar centro
    if (this.cells.length > 0) {
      this.updateCenter();
    }
  }

  /**
   * Reasigna todos los roles óptimamente
   */
  reassignRoles() {
    // Resetear todos los roles
    for (const role in this.roles) {
      if (this.roles[role]) {
        this.roles[role].organRole = null;
        this.roles[role] = null;
      }
    }
    
    // Reasignar cada célula al mejor rol
    for (const cell of this.cells) {
      this.assignRole(cell);
    }
  }

  /**
   * Actualiza el estado del organismo multicelular
   * @param {number} dtSec - Delta time en segundos
   * @param {Array<Cell>} allCells - Todas las células del ecosistema
   * @param {Ecosystem} ecosystem - Referencia al ecosistema
   */
  update(dtSec, allCells, ecosystem) {
    if (this.cells.length === 0) return;
    
    // Verificar miembros activos
    const activeCells = this.cells.filter(c => !c.dead);
    if (activeCells.length === 0) return;
    
    // Tomar decisiones como organismo unificado
    this.decide(dtSec, ecosystem);
    
    // Mover todas las células coordinadamente
    this.moveOrganism(dtSec);
    
    // Procesar roles especializados
    this.processRoles(dtSec, ecosystem);
    
    // Actualizar recursos basados en trabajadores
    if (this.roles.worker) {
      this.resources += 0.02 * dtSec;
    }
    
    // Actualizar defensa basada en defensores
    if (this.roles.defender) {
      this.defenseLevel = Math.min(this.defenseLevel + 0.01 * dtSec, 10);
    }
    
    // Liberar feromonas ocasionalmente
    if (Math.random() < 0.05) {
      this.releasePheromone();
    }
    
    // Actualizar feromonas
    this.updatePheromones(dtSec);
    
    // Crecimiento natural si hay suficientes recursos
    if (this.resources > 5 && this.population < this.maxPopulation) {
      this.resources -= 0.01 * dtSec;
    }
    
    // Verificar muerte del organismo
    if (activeCells.length === 0) {
      // Organismo muerto
    }
  }

  /**
   * Lógica de decisión del organismo (ejecutada por el CEREBRO)
   */
  decide(dtSec, ecosystem) {
    const brain = this.roles.brain;
    if (!brain) return; // Sin cerebro, no hay decisión coordinada
    
    // El cerebro percibe el entorno para todo el organismo
    const perception = brain.perceive(ecosystem);
    
    // Máquina de estados para el organismo completo
    const totalEnergy = this.cells.reduce((sum, c) => sum + c.energy, 0);
    const avgEnergy = totalEnergy / this.cells.length;
    
    if (avgEnergy < 30) {
      this.state = 'feeding';
      this.seekFood(perception, ecosystem);
    } else if (perception.threats.length > 0) {
      const threat = perception.threats[0];
      const distToThreat = Math.sqrt(Math.pow(threat.x - this.x, 2) + Math.pow(threat.y - this.y, 2));
      
      if (distToThreat < this.radius + threat.radius * 2) {
        this.state = 'defending';
        this.fleeOrFight(perception, threat);
      } else {
        this.state = 'alert';
        this.wander(perception);
      }
    } else if (this.population >= 4 && avgEnergy > 50 && this.population < this.maxPopulation * 0.8) {
      this.state = 'reproducing';
      // La reproducción se maneja externamente
    } else {
      this.state = 'wandering';
      this.wander(perception);
    }
  }

  seekFood(perception, ecosystem) {
    if (perception.food.length > 0) {
      const target = perception.food[0];
      const angle = Math.atan2(target.y - this.y, target.x - this.x);
      this.targetX = this.x + Math.cos(angle) * 100;
      this.targetY = this.y + Math.sin(angle) * 100;
    }
  }

  fleeOrFight(perception, threat) {
    const dx = this.x - threat.x;
    const dy = this.y - threat.y;
    const distance = Math.sqrt(dx*dx + dy*dy);
    
    if (distance < this.radius) {
      // Pelear (defensor ataca)
      if (this.roles.defender) {
        this.state = 'fighting';
      } else {
        // Huir si no hay defensor
        const angle = Math.atan2(dy, dx);
        this.targetX = this.x + Math.cos(angle) * 150;
        this.targetY = this.y + Math.sin(angle) * 150;
      }
    } else {
      // Mantener distancia
      const angle = Math.atan2(dy, dx);
      this.targetX = this.x + Math.cos(angle) * 80;
      this.targetY = this.y + Math.sin(angle) * 80;
    }
  }

  wander(perception) {
    // Movimiento aleatorio suave
    if (Math.random() < 0.03) {
      const angle = Math.random() * Math.PI * 2;
      this.targetX = this.x + Math.cos(angle) * 120;
      this.targetY = this.y + Math.sin(angle) * 120;
    }
  }

  /**
   * Mueve todo el organismo coordinadamente manteniendo la formación
   */
  moveOrganism(dtSec) {
    // Calcular vector de movimiento hacia el objetivo
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    if (dist < 1) {
      this.velocityX = 0;
      this.velocityY = 0;
      return;
    }

    // Velocidad base modificada por el rol MUSCLE
    let speed = 30;
    if (this.roles.muscle) {
      speed += this.roles.muscle.genes.speed * 40;
    }
    
    const moveSpeed = Math.min(speed * dtSec, dist);
    this.velocityX = (dx / dist) * moveSpeed;
    this.velocityY = (dy / dist) * moveSpeed;

    // Mover cada célula manteniendo formación relativa
    const formationAngle = Date.now() * 0.001; // Rotación lenta de la formación
    
    this.cells.forEach((cell, index) => {
      if (cell.dead) return;

      // Calcular posición relativa ideal en la formación (espiral/círculo)
      const cellAngle = formationAngle + (index / Math.max(1, this.cells.length)) * Math.PI * 2;
      const targetRelX = Math.cos(cellAngle) * (this.radius * 0.7);
      const targetRelY = Math.sin(cellAngle) * (this.radius * 0.7);

      // Posición objetivo absoluta
      const finalTargetX = this.x + targetRelX + this.velocityX;
      const finalTargetY = this.y + targetRelY + this.velocityY;

      // Mover célula hacia su posición en la formación
      const cellDx = finalTargetX - cell.x;
      const cellDy = finalTargetY - cell.y;
      const cellDist = Math.sqrt(cellDx*cellDx + cellDy*cellDy);
      
      if (cellDist > 0.5) {
        const formationSpeed = Math.min(cellDist, 60 * dtSec);
        cell.x += (cellDx / cellDist) * formationSpeed;
        cell.y += (cellDy / cellDist) * formationSpeed;
      }

      // Consumir energía según rol
      let roleCost = 1.0;
      if (cell.organRole === 'muscle') roleCost = 1.8;
      else if (cell.organRole === 'brain') roleCost = 1.4;
      else if (cell.organRole === 'defender') roleCost = 1.3;
      else roleCost = 0.9;
      
      cell.energy -= cell.metabolism * roleCost * dtSec;
      
      if (cell.energy <= 0) {
        cell.dead = true;
      }
    });

    // Actualizar centro después del movimiento
    this.updateCenter();
  }

  /**
   * Procesa las acciones especializadas de cada rol
   */
  processRoles(dtSec, ecosystem) {
    // STOMACH: Digiere comida para distribuir energía
    if (this.roles.stomach && !this.roles.stomach.dead) {
      // El estómago puede convertir comida en energía compartida más eficientemente
      if (this.resources > 0) {
        const shareAmount = Math.min(this.resources * 0.1, 2);
        this.resources -= shareAmount;
        
        // Distribuir energía a células cercanas
        this.cells.forEach(cell => {
          if (!cell.dead && cell.energy < 50) {
            cell.energy += shareAmount * 0.5;
          }
        });
      }
    }
    
    // DEFENDER: Protege activamente
    if (this.roles.defender && !this.roles.defender.dead) {
      this.roles.defender.aggressionMultiplier = 1.5;
    }
    
    // WORKER: Recoge recursos adicionales
    if (this.roles.worker && !this.roles.worker.dead) {
      // Los trabajadores son más eficientes recolectando
    }
  }

  /**
   * Libera feromonas en la posición de la colonia
   */
  releasePheromone() {
    this.pheromones.push({
      x: this.x + (Math.random() - 0.5) * this.radius * 2,
      y: this.y + (Math.random() - 0.5) * this.radius * 2,
      strength: 1.0,
      type: 'colony',
      age: 0
    });
  }

  /**
   * Actualiza las feromonas
   * @param {number} dtSec 
   */
  updatePheromones(dtSec) {
    for (let i = this.pheromones.length - 1; i >= 0; i--) {
      const phero = this.pheromones[i];
      phero.age += dtSec;
      phero.strength -= 0.01 * dtSec;
      
      if (phero.strength <= 0) {
        this.pheromones.splice(i, 1);
      }
    }
  }

  /**
   * Obtiene la fuerza de feromonas en una posición
   * @param {number} x 
   * @param {number} y 
   * @returns {number}
   */
  getPheromoneStrength(x, y) {
    let total = 0;
    
    for (const phero of this.pheromones) {
      const d = dist(x, y, phero.x, phero.y);
      if (d < 50) {
        total += phero.strength * (1 - d / 50);
      }
    }
    
    return total;
  }

  /**
   * Verifica si una célula está dentro del territorio de la colonia
   * @param {number} x 
   * @param {number} y 
   * @returns {boolean}
   */
  contains(x, y) {
    return dist(x, y, this.x, this.y) <= this.radius;
  }

  /**
   * Renderiza el organismo multicelular
   * @param {CanvasRenderingContext2D} ctx
   * @param {boolean} debug 
   */
  render(ctx, debug = false) {
    if (this.cells.length === 0) return;

    // Dibujar conexiones entre células (tejido conectivo)
    ctx.strokeStyle = this.color.replace('rgb', 'rgba').replace(')', ', 0.3)');
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i < this.cells.length; i++) {
      for (let j = i + 1; j < this.cells.length; j++) {
        const c1 = this.cells[i];
        const c2 = this.cells[j];
        if (!c1.dead && !c2.dead) {
          const d = dist(c1.x, c1.y, c2.x, c2.y);
          if (d < this.radius * 1.5) {
            ctx.moveTo(c1.x, c1.y);
            ctx.lineTo(c2.x, c2.y);
          }
        }
      }
    }
    ctx.stroke();

    // Dibujar contorno del organismo completo
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.radius + 10
    );
    
    gradient.addColorStop(0, this.color.replace('rgb', 'rgba').replace(')', ', 0.15)'));
    gradient.addColorStop(0.7, this.color.replace('rgb', 'rgba').replace(')', ', 0.05)'));
    gradient.addColorStop(1, 'transparent');
    
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + 10, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    ctx.strokeStyle = this.color.replace('rgb', 'rgba').replace(')', ', 0.4)');
    ctx.lineWidth = 1;
    ctx.stroke();

    // Dibujar cada célula con su rol visible
    this.cells.forEach(cell => {
      if (cell.dead) return;
      
      // Dibujar célula base
      cell.draw(ctx);
      
      // Indicador visual del rol
      if (cell.organRole) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let symbol = '';
        let bgColor = '';
        
        switch(cell.organRole) {
          case 'brain':
            symbol = '🧠';
            bgColor = 'rgba(100, 149, 237, 0.6)';
            break;
          case 'stomach':
            symbol = '🍖';
            bgColor = 'rgba(255, 99, 71, 0.6)';
            break;
          case 'muscle':
            symbol = '💪';
            bgColor = 'rgba(255, 165, 0, 0.6)';
            break;
          case 'defender':
            symbol = '🛡️';
            bgColor = 'rgba(100, 100, 100, 0.6)';
            break;
          case 'worker':
            symbol = '⚒️';
            bgColor = 'rgba(144, 238, 144, 0.6)';
            break;
        }
        
        // Dibujar fondo circular para el símbolo
        if (bgColor) {
          ctx.beginPath();
          ctx.arc(cell.x, cell.y - 8, 7, 0, Math.PI * 2);
          ctx.fillStyle = bgColor;
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        
        // Dibujar símbolo
        ctx.fillText(symbol, cell.x, cell.y - 8);
      }
    });

    // Barra de estado del organismo
    if (debug) {
      const barWidth = 60;
      const barHeight = 4;
      const energyRatio = this.cells.reduce((sum, c) => sum + c.energy, 0) / (this.cells.length * 100);
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(this.x - barWidth/2, this.y - this.radius - 20, barWidth, barHeight);
      
      ctx.fillStyle = energyRatio > 0.5 ? '#4caf50' : (energyRatio > 0.25 ? '#ff9800' : '#f44336');
      ctx.fillRect(this.x - barWidth/2, this.y - this.radius - 20, barWidth * energyRatio, barHeight);
      
      // Información detallada
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Estado: ${this.state}`, this.x, this.y - this.radius - 25);
      ctx.fillText(`Células: ${this.population}/${this.maxPopulation}`, this.x, this.y - this.radius - 35);
      ctx.fillText(`Recursos: ${this.resources.toFixed(1)}`, this.x, this.y - this.radius - 45);
    }
  }

  /**
   * Serializa la colonia
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      founderId: this.founderId,
      x: this.x,
      y: this.y,
      radius: this.radius,
      members: Array.from(this.members),
      population: this.population,
      maxPopulation: this.maxPopulation,
      resources: this.resources,
      defenseLevel: this.defenseLevel,
      roles: JSON.parse(JSON.stringify(this.roles)),
      color: this.color
    };
  }

  /**
   * Deserializa una colonia
   * @param {Object} data 
   * @returns {Colony}
   */
  static fromJSON(data) {
    const colony = new Colony(data.id, { id: data.founderId, color: data.color }, data.x, data.y);
    
    colony.members = new Set(data.members);
    colony.population = data.population;
    colony.maxPopulation = data.maxPopulation;
    colony.resources = data.resources;
    colony.defenseLevel = data.defenseLevel;
    colony.roles = data.roles;
    colony.color = data.color;
    colony.radius = data.radius;
    
    return colony;
  }
}

/**
 * @fileoverview Gestor de colonias
 */

export class ColonyManager {
  constructor() {
    this.colonies = new Map();
    this.nextId = 1;
  }

  /**
   * Crea una nueva colonia/organismo
   * @param {Cell} founder 
   * @returns {Colony}
   */
  createColony(founder) {
    const id = `colony_${this.nextId++}`;
    const colony = new Colony(id, founder, founder.x, founder.y);
    
    this.colonies.set(id, colony);
    founder.colonyId = id;
    founder.inColony = true;
    
    return colony;
  }

  /**
   * Obtiene una colonia por ID
   * @param {string} id 
   * @returns {Colony|null}
   */
  getColony(id) {
    return this.colonies.get(id) || null;
  }

  /**
   * Actualiza todas las colonias/organismos
   * @param {number} dtSec 
   * @param {Array<Cell>} allCells 
   * @param {Ecosystem} ecosystem
   */
  update(dtSec, allCells, ecosystem) {
    for (const colony of this.colonies.values()) {
      colony.update(dtSec, allCells, ecosystem);
      
      // Eliminar colonias vacías
      if (colony.population === 0 || colony.cells.length === 0) {
        this.colonies.delete(colony.id);
      }
    }
  }

  /**
   * Renderiza todas las colonias
   * @param {CanvasRenderingContext2D} ctx
   * @param {boolean} debug 
   */
  render(ctx, debug = false) {
    for (const colony of this.colonies.values()) {
      colony.render(ctx, debug);
    }
  }

  /**
   * Obtiene el número de colonias activas
   * @returns {number}
   */
  getCount() {
    return this.colonies.size;
  }

  /**
   * Serializa el gestor de colonias
   * @returns {Object}
   */
  toJSON() {
    return {
      nextId: this.nextId,
      colonies: Array.from(this.colonies.values()).map(c => c.toJSON())
    };
  }

  /**
   * Deserializa el gestor de colonias
   * @param {Object} data 
   * @returns {ColonyManager}
   */
  static fromJSON(data) {
    const manager = new ColonyManager();
    manager.nextId = data.nextId;
    
    for (const colonyData of data.colonies) {
      const colony = Colony.fromJSON(colonyData);
      manager.colonies.set(colony.id, colony);
    }
    
    return manager;
  }
}
