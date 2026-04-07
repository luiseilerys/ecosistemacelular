/**
 * @fileoverview Clase Food - Representa una fuente de alimento en el ecosistema
 */

import { CFG } from '../utils/constants.js';

export class Food {
  /**
   * @param {number} x - Posición X
   * @param {number} y - Posición Y
   * @param {number} [energy=CFG.FE] - Energía que proporciona
   */
  constructor(x, y, energy = CFG.FE) {
    this.x = x;
    this.y = y;
    this.energy = energy;
    this.radius = Math.sqrt(energy / CFG.FSR) * 0.7;
    this.dead = false;
    this.type = 'food';
    this.biome = null;
  }

  /**
   * Renderiza la comida en el canvas
   * @param {CanvasRenderingContext2D} ctx 
   */
  render(ctx) {
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
    gradient.addColorStop(0, '#81c784');
    gradient.addColorStop(0.6, '#4caf50');
    gradient.addColorStop(1, 'rgba(76, 175, 80, 0.1)');
    
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Brillo si está en bioma fértil
    if (this.biome && this.biome.type === 'fertile') {
      ctx.strokeStyle = 'rgba(129, 199, 132, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  /**
   * Consume parte de la energía de la comida
   * @param {number} amount - Cantidad de energía a consumir
   * @returns {number} Energía realmente consumida
   */
  consume(amount) {
    const consumed = Math.min(amount, this.energy);
    this.energy -= consumed;
    
    if (this.energy <= 0.5) {
      this.dead = true;
    } else {
      // Reducir radio proporcionalmente
      this.radius = Math.sqrt(this.energy / CFG.FSR) * 0.7;
    }
    
    return consumed;
  }

  /**
   * Serializa la comida para guardado
   * @returns {Object}
   */
  toJSON() {
    return {
      x: this.x,
      y: this.y,
      energy: this.energy,
      type: 'food'
    };
  }

  /**
   * Deserializa una comida desde JSON
   * @param {Object} data 
   * @returns {Food}
   */
  static fromJSON(data) {
    return new Food(data.x, data.y, data.energy);
  }
}
