/**
 * @fileoverview Clase Biome - Gestiona los diferentes biomas del ecosistema
 */

import { CFG } from '../utils/constants.js';

export class Biome {
  /**
   * @param {string} type - Tipo de bioma (fertile, toxic, radiant, stable)
   * @param {number} x - Posición X del centro
   * @param {number} y - Posición Y del centro
   * @param {number} radius - Radio de influencia
   */
  constructor(type, x, y, radius) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.radius = radius;
    
    // Propiedades según tipo
    this.properties = this.getPropertiesForType(type);
  }

  /**
   * Obtiene propiedades según el tipo de bioma
   * @param {string} type 
   * @returns {Object}
   */
  getPropertiesForType(type) {
    const props = {
      fertile: {
        foodMultiplier: 1.5,
        energyRegen: 0.02,
        color: 'rgba(102, 187, 106, 0.15)',
        description: 'Zona fértil con más recursos'
      },
      toxic: {
        foodMultiplier: 0.3,
        metabolismPenalty: 1.5,
        color: 'rgba(161, 66, 130, 0.15)',
        description: 'Zona tóxica que drena energía'
      },
      radiant: {
        energyRegen: 0.05,
        mutationBoost: 1.3,
        color: 'rgba(255, 215, 0, 0.12)',
        description: 'Zona radiante que acelera mutaciones'
      },
      stable: {
        stability: 1.0,
        color: 'rgba(66, 165, 245, 0.1)',
        description: 'Zona estable sin efectos especiales'
      }
    };
    
    return props[type] || props.stable;
  }

  /**
   * Verifica si un punto está dentro del bioma
   * @param {number} x 
   * @param {number} y 
   * @returns {boolean}
   */
  contains(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    return Math.hypot(dx, dy) <= this.radius;
  }

  /**
   * Obtiene la influencia del bioma en un punto (0-1)
   * @param {number} x 
   * @param {number} y 
   * @returns {number}
   */
  getInfluence(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    const dist = Math.hypot(dx, dy);
    
    if (dist >= this.radius) return 0;
    
    // Influencia decreciente desde el centro
    return 1 - (dist / this.radius);
  }

  /**
   * Renderiza el bioma
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.radius
    );
    
    gradient.addColorStop(0, this.properties.color);
    gradient.addColorStop(1, 'transparent');
    
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Borde sutil
    ctx.strokeStyle = this.properties.color.replace('0.1', '0.3').replace('0.15', '0.4');
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  /**
   * Serializa el bioma
   * @returns {Object}
   */
  toJSON() {
    return {
      type: this.type,
      x: this.x,
      y: this.y,
      radius: this.radius
    };
  }

  /**
   * Deserializa un bioma
   * @param {Object} data 
   * @returns {Biome}
   */
  static fromJSON(data) {
    return new Biome(data.type, data.x, data.y, data.radius);
  }
}

/**
 * @fileoverview Sistema de gestión de biomas
 */

export class BiomeSystem {
  constructor() {
    this.biomes = [];
    this.gridSize = 200;
    this.grid = new Map();
  }

  /**
   * Inicializa los biomas predeterminados
   */
  init() {
    this.biomes = [
      new Biome('fertile', CFG.WS * 0.3, CFG.WS * 0.3, 400),
      new Biome('toxic', CFG.WS * 0.7, CFG.WS * 0.3, 300),
      new Biome('radiant', CFG.WS * 0.5, CFG.WS * 0.6, 350),
      new Biome('stable', CFG.WS * 0.2, CFG.WS * 0.7, 250)
    ];
    
    this.rebuildGrid();
  }

  /**
   * Reconstruye la cuadrícula espacial para búsquedas rápidas
   */
  rebuildGrid() {
    this.grid.clear();
    
    for (const biome of this.biomes) {
      const minX = Math.floor((biome.x - biome.radius) / this.gridSize);
      const maxX = Math.floor((biome.x + biome.radius) / this.gridSize);
      const minY = Math.floor((biome.y - biome.radius) / this.gridSize);
      const maxY = Math.floor((biome.y + biome.radius) / this.gridSize);
      
      for (let gx = minX; gx <= maxX; gx++) {
        for (let gy = minY; gy <= maxY; gy++) {
          const key = `${gx},${gy}`;
          if (!this.grid.has(key)) {
            this.grid.set(key, []);
          }
          this.grid.get(key).push(biome);
        }
      }
    }
  }

  /**
   * Obtiene el bioma predominante en una posición
   * @param {number} x 
   * @param {number} y 
   * @returns {Biome|null}
   */
  getBiomeAt(x, y) {
    const gx = Math.floor(x / this.gridSize);
    const gy = Math.floor(y / this.gridSize);
    const key = `${gx},${gy}`;
    
    const candidates = this.grid.get(key) || [];
    let bestBiome = null;
    let bestInfluence = 0;
    
    for (const biome of candidates) {
      const influence = biome.getInfluence(x, y);
      if (influence > bestInfluence) {
        bestInfluence = influence;
        bestBiome = biome;
      }
    }
    
    return bestBiome;
  }

  /**
   * Obtiene todos los biomas que afectan una posición
   * @param {number} x 
   * @param {number} y 
   * @returns {Array<{biome: Biome, influence: number}>}
   */
  getBiomesAt(x, y) {
    const gx = Math.floor(x / this.gridSize);
    const gy = Math.floor(y / this.gridSize);
    const key = `${gx},${gy}`;
    
    const candidates = this.grid.get(key) || [];
    const result = [];
    
    for (const biome of candidates) {
      const influence = biome.getInfluence(x, y);
      if (influence > 0) {
        result.push({ biome, influence });
      }
    }
    
    return result;
  }

  /**
   * Añade un nuevo bioma
   * @param {Biome} biome 
   */
  addBiome(biome) {
    this.biomes.push(biome);
    this.rebuildGrid();
  }

  /**
   * Renderiza todos los biomas
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    for (const biome of this.biomes) {
      biome.render(ctx);
    }
  }

  /**
   * Serializa el sistema de biomas
   * @returns {Object}
   */
  toJSON() {
    return {
      biomes: this.biomes.map(b => b.toJSON())
    };
  }

  /**
   * Deserializa el sistema de biomas
   * @param {Object} data 
   * @returns {BiomeSystem}
   */
  static fromJSON(data) {
    const system = new BiomeSystem();
    system.biomes = data.biomes.map(b => Biome.fromJSON(b));
    system.rebuildGrid();
    return system;
  }
}
