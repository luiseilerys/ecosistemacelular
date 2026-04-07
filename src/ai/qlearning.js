// ============================================================
//  Q-LEARNING LIGERO
//  Aprendizaje por refuerzo para toma de decisiones
// ============================================================

import { clamp } from '../utils/helpers.js';

/**
 * Implementación ligera de Q-Learning adaptada para células
 */
export class QLearningLight {
  constructor() {
    this.table = new Map();
    this.actions = [
      'flee', 'eat', 'reproduce', 'symbiosis',
      'hunt', 'forage', 'wander', 'investigate'
    ];
    
    // Hiperparámetros
    this.alpha = 0.15;   // Tasa de aprendizaje
    this.gamma = 0.85;   // Factor de descuento
    this.epsilon = 0.15; // Tasa de exploración
  }

  /**
   * Genera una clave de estado basada en condiciones actuales
   */
  stateKey(hunger, hasThreat, hasFood, inColony) {
    const h = hunger > 0.7 ? 'H' : hunger > 0.3 ? 'M' : 'L';
    const t = hasThreat ? 'T' : '-';
    const f = hasFood ? 'F' : '-';
    const c = inColony ? 'C' : '-';
    return `${h}${t}${f}${c}`;
  }

  /**
   * Obtiene el valor Q para un estado-acción
   */
  getQ(state, action) {
    return this.table.get(`${state}_${action}`) || 0;
  }

  /**
   * Establece el valor Q para un estado-acción
   */
  setQ(state, action, value) {
    this.table.set(`${state}_${action}`, value);
  }

  /**
   * Actualiza el valor Q usando la ecuación de Bellman
   */
  update(state, action, reward, nextState) {
    const currentQ = this.getQ(state, action);
    
    // Encontrar el máximo Q para el siguiente estado
    let maxNextQ = -Infinity;
    for (const a of this.actions) {
      const q = this.getQ(nextState, a);
      if (q > maxNextQ) maxNextQ = q;
    }

    // Actualizar usando ecuación de Q-Learning
    const newQ = currentQ + this.alpha * (reward + this.gamma * maxNextQ - currentQ);
    this.setQ(state, action, newQ);
  }

  /**
   * Selecciona una acción usando política epsilon-greedy
   */
  selectAction(state, utilities = null) {
    // Exploración aleatoria
    if (Math.random() < this.epsilon) {
      return this.actions[Math.floor(Math.random() * this.actions.length)];
    }

    // Explotación: elegir mejor acción según Q-values
    let bestAction = null;
    let bestQ = -Infinity;

    for (const action of this.actions) {
      const q = this.getQ(state, action);
      // Combinar con utilidades si están disponibles
      const score = utilities ? q + utilities[action] * 0.15 : q;
      
      if (score > bestQ) {
        bestQ = score;
        bestAction = action;
      }
    }

    return bestAction || 'wander';
  }

  /**
   * Hereda conocimientos Q de un padre
   */
  inherit(parent) {
    if (!parent) return;

    // Heredar todos los valores Q con reducción
    for (const [key, value] of parent.table) {
      this.table.set(key, value * 0.5);
    }
  }

  /**
   * Obtiene estadísticas de la tabla Q
   */
  getStats() {
    const values = Array.from(this.table.values());
    if (values.length === 0) {
      return { entries: 0, avg: 0, max: 0, min: 0 };
    }

    return {
      entries: this.table.size,
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      max: Math.max(...values),
      min: Math.min(...values)
    };
  }

  /**
   * Serializa para guardado
   */
  toJSON() {
    return {
      table: Array.from(this.table.entries()),
      actions: this.actions,
      alpha: this.alpha,
      gamma: this.gamma,
      epsilon: this.epsilon
    };
  }

  /**
   * Crea instancia desde JSON
   */
  static fromJSON(data) {
    const ql = new QLearningLight();
    ql.table = new Map(data.table || []);
    ql.alpha = data.alpha || 0.15;
    ql.gamma = data.gamma || 0.85;
    ql.epsilon = data.epsilon || 0.15;
    return ql;
  }
}
