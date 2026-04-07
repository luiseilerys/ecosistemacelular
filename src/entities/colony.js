/**
 * @fileoverview Clase Colony - Gestiona colonias de células
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
    this.radius = 50;
    this.members = new Set([founder.id]);
    this.created = Date.now();
    this.population = 1;
    this.maxPopulation = 20;
    this.resources = 0;
    this.defenseLevel = 0;
    this.expansionRate = 0.1;
    
    // Roles dentro de la colonia
    this.roles = {
      workers: [],
      defenders: [],
      explorers: [],
      reproducers: [],
      signalers: []
    };
    
    // Feromonas de la colonia
    this.pheromones = [];
    
    // Color basado en el fundador
    this.color = founder.color;
  }

  /**
   * Añade un miembro a la colonia
   * @param {Cell} cell 
   */
  addMember(cell) {
    if (this.members.has(cell.id)) return;
    
    this.members.add(cell.id);
    cell.colonyId = this.id;
    this.population++;
    
    // Asignar rol basado en características de la célula
    this.assignRole(cell);
    
    // Expandir radio si es necesario
    if (this.population > this.maxPopulation * 0.8) {
      this.radius += 10;
      this.maxPopulation += 10;
    }
  }

  /**
   * Remueve un miembro de la colonia
   * @param {string} cellId 
   */
  removeMember(cellId) {
    this.members.delete(cellId);
    this.population--;
    
    // Limpiar roles
    for (const role in this.roles) {
      this.roles[role] = this.roles[role].filter(id => id !== cellId);
    }
  }

  /**
   * Asigna un rol a una célula
   * @param {Cell} cell 
   */
  assignRole(cell) {
    const roleMap = {
      worker: 'workers',
      defender: 'defenders',
      explorer: 'explorers',
      reproducer: 'reproducers',
      signaler: 'signalers'
    };
    
    const roleName = roleMap[cell.role] || 'workers';
    if (!this.roles[roleName].includes(cell.id)) {
      this.roles[roleName].push(cell.id);
      cell.colonyRole = roleName.slice(0, -1); // Quitar la 's' final
    }
  }

  /**
   * Actualiza el estado de la colonia
   * @param {number} dtSec - Delta time en segundos
   * @param {Array<Cell>} allCells - Todas las células del ecosistema
   */
  update(dtSec, allCells) {
    // Verificar miembros activos
    const activeMembers = [];
    for (const cell of allCells) {
      if (cell.colonyId === this.id && !cell.dead) {
        activeMembers.push(cell);
      }
    }
    
    // Actualizar recursos basados en trabajadores
    const workerCount = Math.min(this.roles.workers.length, activeMembers.length);
    this.resources += workerCount * 0.01 * dtSec;
    
    // Actualizar defensa basada en defensores
    const defenderCount = Math.min(this.roles.defenders.length, activeMembers.length);
    this.defenseLevel = Math.min(defenderCount * 0.3, 10);
    
    // Liberar feromonas
    if (Math.random() < 0.1) {
      this.releasePheromone();
    }
    
    // Actualizar feromonas
    this.updatePheromones(dtSec);
    
    // Crecimiento natural
    if (this.resources > 10 && this.population < this.maxPopulation) {
      this.resources -= 0.01 * dtSec;
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
   * Renderiza la colonia
   * @param {CanvasRenderingContext2D} ctx
   * @param {boolean} debug 
   */
  render(ctx, debug = false) {
    // Territorio
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.radius
    );
    
    gradient.addColorStop(0, this.color.replace('rgb', 'rgba').replace(')', ', 0.2)'));
    gradient.addColorStop(1, 'transparent');
    
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Borde
    ctx.strokeStyle = this.color.replace('rgb', 'rgba').replace(')', ', 0.4)'));
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Centro
    ctx.beginPath();
    ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    
    // Feromonas
    for (const phero of this.pheromones) {
      ctx.beginPath();
      ctx.arc(phero.x, phero.y, 3 * phero.strength, 0, Math.PI * 2);
      ctx.fillStyle = this.color.replace('rgb', 'rgba').replace(')', `, ${phero.strength * 0.3})`);
      ctx.fill();
    }
    
    // Información en modo debug
    if (debug) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '10px monospace';
      ctx.fillText(`Pop: ${this.population}/${this.maxPopulation}`, this.x - 40, this.y - this.radius - 10);
      ctx.fillText(`Recursos: ${this.resources.toFixed(1)}`, this.x - 40, this.y - this.radius + 5);
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
   * Crea una nueva colonia
   * @param {Cell} founder 
   * @returns {Colony}
   */
  createColony(founder) {
    const id = `colony_${this.nextId++}`;
    const colony = new Colony(id, founder, founder.x, founder.y);
    
    this.colonies.set(id, colony);
    founder.colonyId = id;
    
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
   * Actualiza todas las colonias
   * @param {number} dtSec 
   * @param {Array<Cell>} allCells 
   */
  update(dtSec, allCells) {
    for (const colony of this.colonies.values()) {
      colony.update(dtSec, allCells);
      
      // Eliminar colonias vacías
      if (colony.population === 0) {
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
