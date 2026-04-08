/**
 * @fileoverview Clase Ecosystem - Motor principal del ecosistema
 */

import { CFG } from '../utils/constants.js';
import { SpatialGrid } from '../core/spatial-grid.js';
import { Cell, Food, BiomeSystem, ColonyManager } from '../entities/index.js';

export class Ecosystem {
  constructor() {
    // Entidades
    this.cells = [];
    this.foods = [];
    
    // Sistemas
    this.biomes = new BiomeSystem();
    this.colonies = new ColonyManager();
    this.spatialGrid = new SpatialGrid(CFG.WS, 100);
    
    // Estadísticas
    this.stats = {
      totalCells: 0,
      totalFood: 0,
      totalColonies: 0,
      maxGeneration: 0,
      births: 0,
      deaths: 0,
      startTime: Date.now()
    };
    
    // Configuración
    this.paused = false;
    this.speed = 1.0;
    this.debugMode = false;
    
    // Callbacks de eventos
    this.onCellBirth = null;
    this.onCellDeath = null;
    this.onColonyCreated = null;
  }

  /**
   * Inicializa el ecosistema
   */
  init() {
    // Inicializar biomas
    this.biomes.init();
    
    // Crear células iniciales
    for (let i = 0; i < CFG.IC; i++) {
      const x = Math.random() * CFG.WS;
      const y = Math.random() * CFG.WS;
      this.createCell(x, y);
    }
    
    // Crear comida inicial
    for (let i = 0; i < CFG.MF; i++) {
      const x = Math.random() * CFG.WS;
      const y = Math.random() * CFG.WS;
      this.createFood(x, y);
    }
    
    this.updateStats();
  }

  /**
   * Crea una nueva célula
   * @param {number} x 
   * @param {number} y 
   * @param {Object} [genes] 
   * @param {Cell} [parent]
   * @returns {Cell}
   */
  createCell(x, y, genes = null, parent = null) {
    const cell = new Cell(x, y, genes, parent);
    this.cells.push(cell);
    this.spatialGrid.insert(cell);
    
    if (parent) {
      this.stats.births++;
      if (this.onCellBirth) {
        this.onCellBirth(cell, parent);
      }
    }
    
    this.updateStats();
    return cell;
  }

  /**
   * Crea una nueva fuente de comida
   * @param {number} x 
   * @param {number} y 
   * @param {number} [energy]
   * @returns {Food}
   */
  createFood(x, y, energy = null) {
    const food = new Food(x, y, energy);
    this.foods.push(food);
    
    // Asignar bioma
    const biome = this.biomes.getBiomeAt(x, y);
    if (biome) {
      food.biome = biome;
      if (biome.properties.foodMultiplier) {
        food.energy *= biome.properties.foodMultiplier;
        food.radius = Math.sqrt(food.energy / CFG.FSR) * 0.7;
      }
    }
    
    return food;
  }

  /**
   * Actualiza el ecosistema
   * @param {number} dt - Delta time en ms
   */
  update(dt) {
    if (this.paused) return;
    
    const scaledDt = dt * this.speed;
    const dtSec = scaledDt / 1000;
    
    // Actualizar cuadrícula espacial
    this.spatialGrid.clear();
    for (const cell of this.cells) {
      if (!cell.dead) {
        this.spatialGrid.insert(cell);
      }
    }
    
    // Actualizar células
    for (const cell of this.cells) {
      if (!cell.dead) {
        cell.update(scaledDt, this.cells, this.foods, this.biomes);
        
        // Reproducción
        if (cell.energy > cell.maxEnergy * 0.7 && cell.reproductionCooldown <= 0) {
          this.attemptReproduction(cell);
        }
        
        // Formación de colonias
        if (!cell.colonyId && cell.energy > cell.maxEnergy * 0.5) {
          this.attemptColonyFormation(cell);
        }
      }
    }
    
    // Actualizar comida
    for (const food of this.foods) {
      if (food.dead) continue;
      
      // Regeneración en biomas fértiles
      const biome = this.biomes.getBiomeAt(food.x, food.y);
      if (biome && biome.properties.energyRegen) {
        food.energy += biome.properties.energyRegen * dtSec;
        food.radius = Math.sqrt(food.energy / CFG.FSR) * 0.7;
      }
    }
    
    // Eliminar entidades muertas
    this.cleanup();
    
    // Generar comida periódicamente
    if (Math.random() < CFG.MC2 * this.speed) {
      const x = Math.random() * CFG.WS;
      const y = Math.random() * CFG.WS;
      this.createFood(x, y);
    }
    
    // Actualizar colonias/organismos
    this.colonies.update(dtSec, this.cells, this);
    
    // Actualizar estadísticas
    this.updateStats();
  }

  /**
   * Intenta la reproducción de una célula
   * @param {Cell} parent
   */
  attemptReproduction(parent) {
    // Buscar pareja cercana
    const nearby = this.spatialGrid.queryRadius(
      parent.x,
      parent.y,
      parent.perceptionRadius
    );
    
    let partner = null;
    for (const cell of nearby) {
      if (cell === parent || cell.dead) continue;
      
      // Compatibilidad genética y de colonia
      const sameColony = cell.colonyId && cell.colonyId === parent.colonyId;
      const compatible = cell.energy > cell.maxEnergy * 0.5;
      
      if (compatible && (sameColony || Math.random() < 0.3)) {
        partner = cell;
        break;
      }
    }
    
    // Reproducción asexual si no hay pareja
    if (!partner && Math.random() < 0.5) {
      partner = parent;
    }
    
    if (partner) {
      // Crear descendencia con genes mezclados
      const genes = this.mixGenes(parent.genes, partner.genes);
      const offsetX = (Math.random() - 0.5) * 40;
      const offsetY = (Math.random() - 0.5) * 40;
      
      const child = this.createCell(
        parent.x + offsetX,
        parent.y + offsetY,
        genes,
        parent
      );
      
      // Coste energético
      parent.energy -= parent.maxEnergy * 0.3;
      if (partner !== parent) {
        partner.energy -= partner.maxEnergy * 0.2;
      }
    }
  }

  /**
   * Mezcla genes de dos padres
   * @param {Object} genes1 
   * @param {Object} genes2 
   * @returns {Object}
   */
  mixGenes(genes1, genes2) {
    const child = {};
    
    for (const gene of Object.keys(genes1)) {
      // 50% de probabilidad de cada padre
      const fromParent1 = Math.random() < 0.5;
      const baseValue = fromParent1 ? genes1[gene] : genes2[gene];
      
      // Mutación
      const mutationRate = (genes1.mutationRate + genes2.mutationRate) / 2;
      const mutation = (Math.random() - 0.5) * mutationRate * 0.3;
      
      child[gene] = Math.max(0, Math.min(1, baseValue + mutation));
    }
    
    return child;
  }

  /**
   * Intenta formar una colonia/organismo multicelular
   * @param {Cell} cell
   */
  attemptColonyFormation(cell) {
    // Las células pueden unirse a organismos existentes o formar nuevos
    if (!cell.colonyId && cell.energy > 50 && Math.random() < 0.02) {
      // Buscar organismo cercano para unirse
      const nearby = this.spatialGrid.queryRadius(cell.x, cell.y, 60);
      let joinedExisting = false;
      
      for (const other of nearby) {
        if (other !== cell && other.colonyId && other.inColony && other.energy > 30) {
          const colony = this.colonies.getColony(other.colonyId);
          if (colony && colony.population < colony.maxPopulation) {
            // Unirse al organismo existente
            colony.addMember(cell);
            joinedExisting = true;
            
            if (this.onColonyCreated) {
              this.onColonyCreated(colony);
            }
            break;
          }
        }
      }
      
      // Si no se unió a ninguno, crear nuevo organismo
      if (!joinedExisting) {
        const colony = this.colonies.createColony(cell);
        
        if (this.onColonyCreated) {
          this.onColonyCreated(colony);
        }
      }
    }
  }

  /**
   * Limpia entidades muertas
   */
  cleanup() {
    // Eliminar células muertas
    const initialCellCount = this.cells.length;
    this.cells = this.cells.filter(cell => {
      if (cell.dead) {
        this.stats.deaths++;
        if (this.onCellDeath) {
          this.onCellDeath(cell);
        }
        return false;
      }
      return true;
    });
    
    // Eliminar comida consumida
    this.foods = this.foods.filter(food => !food.dead);
    
    // Actualizar gestor de colonias - limpiar miembros muertos
    for (const colony of this.colonies.colonies.values()) {
      const deadCells = colony.cells.filter(c => c.dead);
      for (const cell of deadCells) {
        colony.removeMember(cell);
      }
    }
  }

  /**
   * Actualiza las estadísticas
   */
  updateStats() {
    this.stats.totalCells = this.cells.filter(c => !c.dead).length;
    this.stats.totalFood = this.foods.filter(f => !f.dead).length;
    this.stats.totalColonies = this.colonies.getCount();
    
    let maxGen = 0;
    for (const cell of this.cells) {
      if (cell.generation > maxGen) {
        maxGen = cell.generation;
      }
    }
    this.stats.maxGeneration = maxGen;
  }

  /**
   * Renderiza el ecosistema
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    // Renderizar biomas
    this.biomes.render(ctx);
    
    // Renderizar comida
    for (const food of this.foods) {
      if (!food.dead) {
        food.render(ctx);
      }
    }
    
    // Renderizar colonias
    this.colonies.render(ctx, this.debugMode);
    
    // Renderizar células
    for (const cell of this.cells) {
      if (!cell.dead) {
        cell.render(ctx, this.debugMode);
      }
    }
  }

  /**
   * Obtiene una célula por ID
   * @param {string} id
   * @returns {Cell|null}
   */
  getCellById(id) {
    return this.cells.find(c => c.id === id && !c.dead) || null;
  }

  /**
   * Serializa el ecosistema para guardado
   * @returns {Object}
   */
  toJSON() {
    return {
      cells: this.cells.filter(c => !c.dead).map(c => c.toJSON()),
      foods: this.foods.filter(f => !f.dead).map(f => f.toJSON()),
      biomes: this.biomes.toJSON(),
      colonies: this.colonies.toJSON(),
      stats: this.stats
    };
  }

  /**
   * Deserializa un ecosistema desde JSON
   * @param {Object} data
   * @returns {Ecosystem}
   */
  static fromJSON(data) {
    const ecosystem = new Ecosystem();
    
    // Restaurar biomas
    ecosystem.biomes = BiomeSystem.fromJSON(data.biomes);
    
    // Restaurar colonias
    ecosystem.colonies = ColonyManager.fromJSON(data.colonies);
    
    // Restaurar células
    for (const cellData of data.cells) {
      const cell = Cell.fromJSON(cellData, true);
      ecosystem.cells.push(cell);
    }
    
    // Restaurar comida
    for (const foodData of data.foods) {
      const food = Food.fromJSON(foodData);
      ecosystem.foods.push(food);
    }
    
    // Restaurar estadísticas
    ecosystem.stats = data.stats;
    
    ecosystem.updateStats();
    return ecosystem;
  }

  /**
   * Guarda el ecosistema en localStorage
   * @param {string} key
   */
  save(key = 'ecosystem_save') {
    const data = this.toJSON();
    localStorage.setItem(key, JSON.stringify(data));
  }

  /**
   * Carga el ecosistema desde localStorage
   * @param {string} key
   * @returns {boolean}
   */
  load(key = 'ecosystem_save') {
    const data = localStorage.getItem(key);
    if (!data) return false;
    
    try {
      const parsed = JSON.parse(data);
      const loaded = Ecosystem.fromJSON(parsed);
      
      // Copiar estado
      this.cells = loaded.cells;
      this.foods = loaded.foods;
      this.biomes = loaded.biomes;
      this.colonies = loaded.colonies;
      this.stats = loaded.stats;
      
      this.updateStats();
      return true;
    } catch (e) {
      console.error('Error loading ecosystem:', e);
      return false;
    }
  }

  /**
   * Reinicia el ecosistema
   */
  reset() {
    this.cells = [];
    this.foods = [];
    this.colonies = new ColonyManager();
    this.stats = {
      totalCells: 0,
      totalFood: 0,
      totalColonies: 0,
      maxGeneration: 0,
      births: 0,
      deaths: 0,
      startTime: Date.now()
    };
    
    this.init();
  }
}
