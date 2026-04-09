// ============================================================
//  Q-LEARNING AVANZADO CON FUNCIONES DE APROXIMACIÓN
//  Aprendizaje por refuerzo mejorado con generalización
// ============================================================

import { clamp, sigmoid } from '../utils/helpers.js';

/**
 * Implementación avanzada de Q-Learning con aproximación de funciones
 * y exploración adaptativa para células autónomas
 */
export class QLearningLight {
  constructor() {
    this.table = new Map();
    this.actions = [
      'flee', 'eat', 'reproduce', 'symbiosis',
      'hunt', 'forage', 'wander', 'investigate'
    ];
    
    // Hiperparámetros dinámicos
    this.alpha = 0.2;        // Tasa de aprendizaje (adaptativa)
    this.gamma = 0.9;        // Factor de descuento
    this.epsilon = 0.2;      // Tasa de exploración (adaptativa)
    this.epsilonDecay = 0.995; // Decaimiento de exploración
    this.minEpsilon = 0.05;    // Exploración mínima
    
    // Características para aproximación de funciones
    this.featureWeights = {};
    this.initializeFeatureWeights();
    
    // Historial de experiencias para replay
    this.experienceReplay = [];
    this.maxReplaySize = 100;
    
    // Contadores para adaptación
    this.actionCounts = {};
    this.successRates = {};
    this.totalSteps = 0;
    
    // Inicializar contadores
    for (const action of this.actions) {
      this.actionCounts[action] = 0;
      this.successRates[action] = 0.5; // Valor inicial neutral
    }
  }

  /**
   * Inicializa pesos de características para aproximación
   */
  initializeFeatureWeights() {
    const features = ['hunger', 'threat', 'food_nearby', 'in_colony', 'energy', 'stress'];
    for (const feature of features) {
      this.featureWeights[feature] = {};
      for (const action of this.actions) {
        this.featureWeights[feature][action] = (Math.random() - 0.5) * 0.1;
      }
    }
  }

  /**
   * Genera una clave de estado basada en condiciones actuales (discretizado)
   */
  stateKey(hunger, hasThreat, hasFood, inColony, energy, stress) {
    const h = hunger > 0.7 ? 'H' : hunger > 0.3 ? 'M' : 'L';
    const t = hasThreat ? 'T' : '-';
    const f = hasFood ? 'F' : '-';
    const c = inColony ? 'C' : '-';
    const e = energy > 0.7 ? 'H' : energy > 0.3 ? 'M' : 'L';
    const s = stress > 0.6 ? 'S' : stress > 0.3 ? 'M' : '-';
    return `${h}${t}${f}${c}${e}${s}`;
  }

  /**
   * Calcula características continuas del estado
   */
  getFeatures(hunger, hasThreat, hasFood, inColony, energy, stress) {
    return {
      hunger: hunger,
      threat: hasThreat ? 1 : 0,
      food_nearby: hasFood ? 1 : 0,
      in_colony: inColony ? 1 : 0,
      energy: energy,
      stress: stress
    };
  }

  /**
   * Obtiene el valor Q usando aproximación de funciones
   */
  getQ(state, action, features = null) {
    const key = `${state}_${action}`;
    const tableValue = this.table.get(key) || 0;
    
    // Si hay características, añadir aproximación lineal
    if (features) {
      let approxValue = 0;
      for (const [featureName, value] of Object.entries(features)) {
        if (this.featureWeights[featureName] && this.featureWeights[featureName][action]) {
          approxValue += this.featureWeights[featureName][action] * value;
        }
      }
      return tableValue + approxValue;
    }
    
    return tableValue;
  }

  /**
   * Establece el valor Q para un estado-acción
   */
  setQ(state, action, value) {
    this.table.set(`${state}_${action}`, value);
  }

  /**
   * Actualiza el valor Q usando la ecuación de Bellman con experiencia replay
   */
  update(state, action, reward, nextState, features = null) {
    const currentQ = this.getQ(state, action, features);
    
    // Encontrar el máximo Q para el siguiente estado
    let maxNextQ = -Infinity;
    for (const a of this.actions) {
      const q = this.getQ(nextState, a, features);
      if (q > maxNextQ) maxNextQ = q;
    }

    // Tasa de aprendizaje adaptativa basada en frecuencia de acción
    const adaptiveAlpha = this.alpha / (1 + Math.log(1 + this.actionCounts[action] || 1));
    
    // Actualizar usando ecuación de Q-Learning
    const tdError = reward + this.gamma * maxNextQ - currentQ;
    const newQ = currentQ + adaptiveAlpha * tdError;
    this.setQ(state, action, newQ);
    
    // Actualizar pesos de características si existen
    if (features) {
      for (const [featureName, value] of Object.entries(features)) {
        if (this.featureWeights[featureName] && this.featureWeights[featureName][action]) {
          this.featureWeights[featureName][action] += adaptiveAlpha * tdError * value * 0.1;
          this.featureWeights[featureName][action] = clamp(this.featureWeights[featureName][action], -1, 1);
        }
      }
    }
    
    // Guardar experiencia para replay
    this.experienceReplay.push({ state, action, reward, nextState, features });
    if (this.experienceReplay.length > this.maxReplaySize) {
      this.experienceReplay.shift();
    }
    
    // Actualizar estadísticas
    this.actionCounts[action] = (this.actionCounts[action] || 0) + 1;
    this.totalSteps++;
    
    // Actualizar tasa de éxito (recompensa positiva = éxito)
    if (reward > 0) {
      this.successRates[action] = clamp(
        this.successRates[action] * 0.95 + 0.05,
        0, 1
      );
    } else {
      this.successRates[action] = clamp(
        this.successRates[action] * 0.95,
        0, 1
      );
    }
    
    // Aprendizaje offline desde replay (cada 10 pasos)
    if (this.totalSteps % 10 === 0 && this.experienceReplay.length > 5) {
      this.replayExperience();
    }
  }

  /**
   * Realiza replay de experiencias pasadas para mejorar aprendizaje
   */
  replayExperience(batchSize = 5) {
    const batch = [];
    const indices = new Set();
    
    // Muestrear experiencias aleatorias
    while (indices.size < Math.min(batchSize, this.experienceReplay.length)) {
      indices.add(Math.floor(Math.random() * this.experienceReplay.length));
    }
    
    for (const idx of indices) {
      batch.push(this.experienceReplay[idx]);
    }
    
    // Actualizar desde batch
    for (const exp of batch) {
      const currentQ = this.getQ(exp.state, exp.action, exp.features);
      let maxNextQ = -Infinity;
      
      for (const a of this.actions) {
        const q = this.getQ(exp.nextState, a, exp.features);
        if (q > maxNextQ) maxNextQ = q;
      }
      
      const tdError = exp.reward + this.gamma * maxNextQ - currentQ;
      const newQ = currentQ + this.alpha * 0.5 * tdError; // Menor alpha para replay
      this.setQ(exp.state, exp.action, newQ);
    }
  }

  /**
   * Selecciona una acción usando política epsilon-greedy con Upper Confidence Bound
   */
  selectAction(state, utilities = null, features = null) {
    // Exploración vs explotación con UCB1
    const ucbValues = {};
    
    for (const action of this.actions) {
      const q = this.getQ(state, action, features);
      const utilityBonus = utilities ? (utilities[action] || 0) * 0.15 : 0;
      
      // Término de exploración UCB1
      const count = this.actionCounts[action] || 0;
      const explorationBonus = count === 0 
        ? Infinity 
        : Math.sqrt(2 * Math.log(this.totalSteps + 1) / (count + 1));
      
      ucbValues[action] = q + utilityBonus + explorationBonus * 0.1;
    }
    
    // Epsilon-greedy con UCB
    if (Math.random() < this.epsilon) {
      // Exploración: elegir entre acciones poco exploradas o aleatorias
      const unexplored = this.actions.filter(a => (this.actionCounts[a] || 0) === 0);
      if (unexplored.length > 0) {
        return unexplored[Math.floor(Math.random() * unexplored.length)];
      }
      return this.actions[Math.floor(Math.random() * this.actions.length)];
    }
    
    // Explotación: elegir mejor acción según UCB
    let bestAction = null;
    let bestValue = -Infinity;
    
    for (const [action, value] of Object.entries(ucbValues)) {
      if (value > bestValue) {
        bestValue = value;
        bestAction = action;
      }
    }
    
    // Reducir epsilon gradualmente
    this.epsilon = Math.max(this.minEpsilon, this.epsilon * this.epsilonDecay);
    
    return bestAction || 'wander';
  }

  /**
   * Hereda conocimientos Q de un padre con transferencia de conocimiento
   */
  inherit(parent) {
    if (!parent) return;

    // Heredar valores Q con reducción y preservación de patrones exitosos
    for (const [key, value] of parent.table) {
      // Preservar mejor los valores altos (éxitos)
      const retention = value > 0 ? 0.7 : 0.4;
      this.table.set(key, value * retention);
    }
    
    // Heredar pesos de características
    for (const feature in parent.featureWeights) {
      if (this.featureWeights[feature]) {
        for (const action in parent.featureWeights[feature]) {
          this.featureWeights[feature][action] = 
            parent.featureWeights[feature][action] * 0.6;
        }
      }
    }
    
    // Heredar estadísticas parcialmente
    for (const action of this.actions) {
      this.actionCounts[action] = Math.floor((parent.actionCounts[action] || 0) * 0.3);
      this.successRates[action] = parent.successRates[action] * 0.5 + 0.25;
    }
    
    this.totalSteps = Math.floor(parent.totalSteps * 0.2);
  }

  /**
   * Obtiene estadísticas detalladas de la tabla Q
   */
  getStats() {
    const values = Array.from(this.table.values());
    if (values.length === 0) {
      return { 
        entries: 0, 
        avg: 0, 
        max: 0, 
        min: 0,
        explorationRate: this.epsilon,
        totalSteps: this.totalSteps,
        bestAction: null,
        successRates: {}
      };
    }

    // Encontrar mejor acción
    let bestAction = null;
    let bestSuccessRate = 0;
    for (const action of this.actions) {
      if (this.successRates[action] > bestSuccessRate) {
        bestSuccessRate = this.successRates[action];
        bestAction = action;
      }
    }

    return {
      entries: this.table.size,
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      max: Math.max(...values),
      min: Math.min(...values),
      explorationRate: this.epsilon,
      totalSteps: this.totalSteps,
      bestAction: bestAction,
      successRates: { ...this.successRates },
      experienceReplaySize: this.experienceReplay.length
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
      epsilon: this.epsilon,
      featureWeights: this.featureWeights,
      experienceReplay: this.experienceReplay.slice(-20), // Últimas 20 experiencias
      actionCounts: this.actionCounts,
      successRates: this.successRates,
      totalSteps: this.totalSteps
    };
  }

  /**
   * Crea instancia desde JSON
   */
  static fromJSON(data) {
    const ql = new QLearningLight();
    ql.table = new Map(data.table || []);
    ql.alpha = data.alpha || 0.2;
    ql.gamma = data.gamma || 0.9;
    ql.epsilon = data.epsilon || 0.2;
    ql.featureWeights = data.featureWeights || {};
    ql.experienceReplay = data.experienceReplay || [];
    ql.actionCounts = data.actionCounts || {};
    ql.successRates = data.successRates || {};
    ql.totalSteps = data.totalSteps || 0;
    
    // Inicializar contadores faltantes
    for (const action of ql.actions) {
      if (!ql.actionCounts[action]) ql.actionCounts[action] = 0;
      if (!ql.successRates[action]) ql.successRates[action] = 0.5;
    }
    
    return ql;
  }
}
