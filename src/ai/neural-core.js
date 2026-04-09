// ============================================================
//  RED NEURONAL RECURRENTE AVANZADA
//  Procesamiento de decisiones complejas con arquitectura mejorada
// ============================================================

import { clamp, randomRange, sigmoid } from '../utils/helpers.js';

/**
 * Red neuronal recurrente avanzada con atención y múltiples capas
 * Arquitectura: 12 entradas -> 10 ocultas (con recurrencia) -> 8 salidas
 */
export class NeuralCore {
  constructor(weights = null) {
    // Arquitectura mejorada: 12 entradas -> 10 ocultas -> 8 salidas
    this.inputSize = 12;
    this.hiddenSize = 10;
    this.outputSize = 8;
    
    // Hiperparámetros de activación
    this.activationFunctions = ['tanh', 'relu', 'sigmoid', 'leaky_relu'];
    this.hiddenActivation = 'tanh';
    this.outputActivation = 'sigmoid';

    if (weights) {
      this.weights = weights;
    } else {
      // Inicialización Xavier/He para mejor convergencia
      this.weights = this.initializeWeights();
    }

    // Estado de las neuronas ocultas (memoria recurrente)
    this.hiddenState = new Array(this.hiddenSize).fill(0);
    this.previousInput = new Array(this.inputSize).fill(0);
    
    // Atención simple para focalizar en entradas importantes
    this.attentionWeights = new Array(this.inputSize).fill(1 / this.inputSize);
    
    // Historial de activaciones para aprendizaje temporal
    this.activationHistory = [];
    this.maxHistory = 5;
  }

  /**
   * Inicializa pesos usando inicialización Xavier/He
   */
  initializeWeights() {
    const scaleIH = Math.sqrt(2.0 / (this.inputSize + this.hiddenSize));
    const scaleHH = Math.sqrt(2.0 / (this.hiddenSize + this.hiddenSize));
    const scaleHO = Math.sqrt(2.0 / (this.hiddenSize + this.outputSize));

    return {
      ih: Array.from({ length: this.inputSize * this.hiddenSize }, () => randomRange(-scaleIH, scaleIH)),
      hh: Array.from({ length: this.hiddenSize * this.hiddenSize }, () => randomRange(-scaleHH * 0.5, scaleHH * 0.5)),
      ho: Array.from({ length: this.hiddenSize * this.outputSize }, () => randomRange(-scaleHO, scaleHO)),
      bias_h: Array.from({ length: this.hiddenSize }, () => randomRange(-0.1, 0.1)),
      bias_o: Array.from({ length: this.outputSize }, () => randomRange(-0.1, 0.1)),
      // Pesos de atención
      attention: Array.from({ length: this.inputSize }, () => 1 / this.inputSize)
    };
  }

  /**
   * Función de activación con derivada para backpropagation futuro
   */
  activate(x, type = 'tanh') {
    switch (type) {
      case 'relu':
        return Math.max(0, x);
      case 'leaky_relu':
        return x > 0 ? x : 0.01 * x;
      case 'sigmoid':
        return 1 / (1 + Math.exp(-x));
      case 'tanh':
      default:
        return Math.tanh(x);
    }
  }

  /**
   * Aplica atención a las entradas
   */
  applyAttention(inputs) {
    const attendedInputs = [];
    let totalAttention = 0;
    
    for (let i = 0; i < this.inputSize; i++) {
      const attention = this.activate(this.weights.attention[i], 'sigmoid');
      attendedInputs.push(inputs[i] * attention);
      totalAttention += attention;
    }
    
    // Normalizar atención
    if (totalAttention > 0) {
      for (let i = 0; i < this.inputSize; i++) {
        attendedInputs[i] /= totalAttention;
      }
    }
    
    return attendedInputs;
  }

  /**
   * Propagación hacia adelante con atención y recurrencia
   * @param {number[]} inputs - Array de 12 valores de entrada
   * @returns {number[]} - Array de 8 valores de salida
   */
  forward(inputs) {
    // Guardar input anterior para cálculo de diferencia temporal
    this.previousInput = [...inputs];
    
    // Aplicar mecanismo de atención
    const attendedInputs = this.applyAttention(inputs);
    
    const { ih, hh, ho, bias_h, bias_o } = this.weights;
    const newHidden = [];

    // Calcular nueva capa oculta
    for (let i = 0; i < this.hiddenSize; i++) {
      let sum = bias_h[i];

      // Conexiones desde entrada (con atención)
      for (let j = 0; j < this.inputSize; j++) {
        sum += ih[i * this.inputSize + j] * attendedInputs[j];
      }

      // Conexiones recurrentes desde estado anterior (con gate)
      let recurrentSum = 0;
      for (let j = 0; j < this.hiddenSize; j++) {
        recurrentSum += hh[i * this.hiddenSize + j] * this.hiddenState[j];
      }
      
      // Gate recurrente para controlar flujo de información
      const recurrentGate = this.activate(recurrentSum * 0.5, 'sigmoid');
      sum += recurrentGate * recurrentSum;

      // Función de activación
      newHidden.push(this.activate(sum, this.hiddenActivation));
    }

    // Actualizar estado oculto con momentum
    const momentum = 0.9;
    for (let i = 0; i < this.hiddenSize; i++) {
      this.hiddenState[i] = momentum * this.hiddenState[i] + (1 - momentum) * newHidden[i];
    }

    // Calcular capa de salida
    const output = [];
    for (let i = 0; i < this.outputSize; i++) {
      let sum = bias_o[i];

      for (let j = 0; j < this.hiddenSize; j++) {
        sum += ho[i * this.hiddenSize + j] * this.hiddenState[j];
      }

      // Función de activación de salida
      output.push(this.activate(sum, this.outputActivation));
    }

    // Guardar en historial
    this.activationHistory.push({ inputs: [...attendedInputs], hidden: [...this.hiddenState], outputs: [...output] });
    if (this.activationHistory.length > this.maxHistory) {
      this.activationHistory.shift();
    }

    return output;
  }

  /**
   * Resetea el estado oculto y el historial
   */
  reset() {
    this.hiddenState.fill(0);
    this.previousInput.fill(0);
    this.activationHistory = [];
  }

  /**
   * Actualiza los pesos de atención basados en importancia
   */
  updateAttention(importance) {
    for (let i = 0; i < this.inputSize; i++) {
      // Aumentar atención para entradas importantes
      this.weights.attention[i] += 0.1 * (importance[i] || 0);
    }
    
    // Normalizar pesos de atención
    const total = this.weights.attention.reduce((a, b) => a + b, 0);
    if (total > 0) {
      for (let i = 0; i < this.inputSize; i++) {
        this.weights.attention[i] /= total;
      }
    }
  }

  /**
   * Hereda pesos con mutación adaptativa
   */
  inherit(parent, mutationRate = 0.15) {
    if (!parent) return;

    // Mutación adaptativa basada en fitness implícito
    const adaptiveMutation = (baseRate) => {
      return baseRate * (0.5 + Math.random());
    };

    const mutateArray = (arr, rate, strength) => {
      return arr.map(v => {
        if (Math.random() < adaptiveMutation(rate)) {
          return v + randomRange(-strength, strength);
        }
        return v;
      });
    };

    const strengthIH = 0.15;
    const strengthHH = 0.1;
    const strengthHO = 0.15;
    const strengthBias = 0.08;

    this.weights = {
      ih: mutateArray(parent.weights.ih, mutationRate, strengthIH),
      hh: mutateArray(parent.weights.hh, mutationRate * 0.7, strengthHH),
      ho: mutateArray(parent.weights.ho, mutationRate, strengthHO),
      bias_h: mutateArray(parent.weights.bias_h, mutationRate * 0.5, strengthBias),
      bias_o: mutateArray(parent.weights.bias_o, mutationRate * 0.5, strengthBias),
      attention: mutateArray(parent.weights.attention, mutationRate * 0.3, 0.05)
    };

    this.reset();
  }

  /**
   * Obtiene estadísticas detalladas de la red
   */
  getStats() {
    const allWeights = [
      ...this.weights.ih,
      ...this.weights.hh,
      ...this.weights.ho,
      ...this.weights.bias_h,
      ...this.weights.bias_o
    ];

    const variance = (arr) => {
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
      return arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
    };

    return {
      total: allWeights.length,
      avg: allWeights.reduce((a, b) => a + b, 0) / allWeights.length,
      max: Math.max(...allWeights),
      min: Math.min(...allWeights),
      variance: variance(allWeights),
      attentionEntropy: this.calculateAttentionEntropy(),
      hiddenActivity: this.hiddenState.reduce((a, b) => a + Math.abs(b), 0) / this.hiddenSize
    };
  }

  /**
   * Calcula la entropía de la distribución de atención
   */
  calculateAttentionEntropy() {
    let entropy = 0;
    for (const w of this.weights.attention) {
      if (w > 0) {
        entropy -= w * Math.log2(w);
      }
    }
    return entropy;
  }

  /**
   * Obtiene patrones de activación recientes
   */
  getActivationPatterns() {
    return this.activationHistory.map(h => ({
      dominantHidden: h.hidden.indexOf(Math.max(...h.hidden)),
      outputDistribution: h.outputs
    }));
  }

  /**
   * Serializa para guardado
   */
  toJSON() {
    return {
      weights: this.weights,
      hiddenState: this.hiddenState,
      previousInput: this.previousInput,
      attentionWeights: this.attentionWeights,
      activationHistory: this.activationHistory.slice(-3) // Guardar solo últimos 3
    };
  }

  /**
   * Crea instancia desde JSON
   */
  static fromJSON(data) {
    const neural = new NeuralCore(data.weights);
    neural.hiddenState = data.hiddenState || new Array(10).fill(0);
    neural.previousInput = data.previousInput || new Array(12).fill(0);
    neural.attentionWeights = data.attentionWeights || new Array(12).fill(1/12);
    neural.activationHistory = data.activationHistory || [];
    return neural;
  }
}
