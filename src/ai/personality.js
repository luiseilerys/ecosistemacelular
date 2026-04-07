// ============================================================
//  SISTEMA DE PERSONALIDAD
//  Rasgos únicos de comportamiento por célula
// ============================================================

import { lerp, randomRange } from '../utils/helpers.js';

/**
 * Define los rasgos de personalidad de una célula
 */
export class Personality {
  constructor(parent = null) {
    if (parent) {
      // Herencia con variación
      this.caution = lerp(parent.caution, randomRange(0.3, 0.7), 0.3);
      this.optimism = lerp(parent.optimism, randomRange(0.3, 0.7), 0.3);
      this.stubbornness = lerp(parent.stubbornness, randomRange(0.2, 0.6), 0.3);
      this.empathy = lerp(parent.empathy, randomRange(0.3, 0.7), 0.3);
      this.creativity = lerp(parent.creativity, randomRange(0.2, 0.5), 0.3);
      this.routine = lerp(parent.routine, randomRange(0.3, 0.6), 0.3);
    } else {
      // Personalidad inicial aleatoria
      this.caution = randomRange(0.2, 0.8);
      this.optimism = randomRange(0.3, 0.7);
      this.stubbornness = randomRange(0.1, 0.5);
      this.empathy = randomRange(0.2, 0.6);
      this.creativity = randomRange(0.1, 0.4);
      this.routine = randomRange(0.2, 0.6);
    }
  }

  /**
   * Serializa la personalidad para guardado
   */
  toJSON() {
    return {
      caution: this.caution,
      optimism: this.optimism,
      stubbornness: this.stubbornness,
      empathy: this.empathy,
      creativity: this.creativity,
      routine: this.routine
    };
  }

  /**
   * Crea una instancia desde JSON
   */
  static fromJSON(data) {
    const p = new Personality();
    Object.assign(p, data);
    return p;
  }
}
