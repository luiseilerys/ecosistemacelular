// ============================================================
//  RED NEURONAL RECURRENTE SIMPLE
//  Procesamiento de decisiones complejas
// ============================================================

import { clamp, randomRange } from '../utils/helpers.js';

/**
 * Red neuronal recurrente ligera para toma de decisiones
 */
export class NeuralCore {
  constructor(weights = null) {
    // Arquitectura: 8 entradas -> 6 ocultas -> 8 salidas
    this.inputSize = 8;
    this.hiddenSize = 6;
    this.outputSize = 8;

    if (weights) {
      this.weights = weights;
    } else {
      // Inicialización aleatoria
      this.weights = {
        ih: Array.from({ length: 48 }, () => randomRange(-0.5, 0.5)),   // Input -> Hidden
        hh: Array.from({ length: 36 }, () => randomRange(-0.3, 0.3)),   // Hidden -> Hidden (recurrente)
        ho: Array.from({ length: 48 }, () => randomRange(-0.5, 0.5)),   // Hidden -> Output
        bias_h: Array.from({ length: 6 }, () => randomRange(-0.2, 0.2)),
        bias_o: Array.from({ length: 8 }, () => randomRange(-0.2, 0.2))
      };
    }

    // Estado de las neuronas ocultas (memoria recurrente)
    this.hiddenState = new Array(this.hiddenSize).fill(0);
  }

  /**
   * Propagación hacia adelante
   * @param {number[]} inputs - Array de 8 valores de entrada
   * @returns {number[]} - Array de 8 valores de salida
   */
  forward(inputs) {
    const { ih, hh, ho, bias_h, bias_o } = this.weights;
    const newHidden = [];

    // Calcular nueva capa oculta
    for (let i = 0; i < this.hiddenSize; i++) {
      let sum = bias_h[i];

      // Conexiones desde entrada
      for (let j = 0; j < this.inputSize; j++) {
        sum += ih[i * this.inputSize + j] * inputs[j];
      }

      // Conexiones recurrentes desde estado anterior
      for (let j = 0; j < this.hiddenSize; j++) {
        sum += hh[i * this.hiddenSize + j] * this.hiddenState[j];
      }

      // Función de activación tanh
      newHidden.push(Math.tanh(sum));
    }

    // Actualizar estado oculto
    this.hiddenState = newHidden;

    // Calcular capa de salida
    const output = [];
    for (let i = 0; i < this.outputSize; i++) {
      let sum = bias_o[i];

      for (let j = 0; j < this.hiddenSize; j++) {
        sum += ho[i * this.hiddenSize + j] * this.hiddenState[j];
      }

      // Función de activación con rango limitado
      output.push(clamp(1.0 + sum * 0.5, 0.15, 2.5));
    }

    return output;
  }

  /**
   * Resetea el estado oculto
   */
  reset() {
    this.hiddenState.fill(0);
  }

  /**
   * Hereda pesos con mutación
   */
  inherit(parent) {
    if (!parent) return;

    const mutationRate = 0.1;
    const mutationStrength = 0.1;

    this.weights = {
      ih: parent.weights.ih.map(v => {
        return Math.random() < mutationRate 
          ? v + randomRange(-mutationStrength, mutationStrength)
          : v * 0.7;
      }),
      hh: parent.weights.hh.map(v => {
        return Math.random() < mutationRate 
          ? v + randomRange(-mutationStrength, mutationStrength)
          : v * 0.7;
      }),
      ho: parent.weights.ho.map(v => {
        return Math.random() < mutationRate 
          ? v + randomRange(-mutationStrength, mutationStrength)
          : v * 0.7;
      }),
      bias_h: parent.weights.bias_h.map(v => {
        return Math.random() < mutationRate * 0.5
          ? v + randomRange(-mutationStrength * 0.5, mutationStrength * 0.5)
          : v * 0.7;
      }),
      bias_o: parent.weights.bias_o.map(v => {
        return Math.random() < mutationRate * 0.5
          ? v + randomRange(-mutationStrength * 0.5, mutationStrength * 0.5)
          : v * 0.7;
      })
    };

    this.reset();
  }

  /**
   * Obtiene estadísticas de los pesos
   */
  getStats() {
    const allWeights = [
      ...this.weights.ih,
      ...this.weights.hh,
      ...this.weights.ho,
      ...this.weights.bias_h,
      ...this.weights.bias_o
    ];

    return {
      total: allWeights.length,
      avg: allWeights.reduce((a, b) => a + b, 0) / allWeights.length,
      max: Math.max(...allWeights),
      min: Math.min(...allWeights)
    };
  }

  /**
   * Serializa para guardado
   */
  toJSON() {
    return {
      weights: this.weights,
      hiddenState: this.hiddenState
    };
  }

  /**
   * Crea instancia desde JSON
   */
  static fromJSON(data) {
    const neural = new NeuralCore(data.weights);
    neural.hiddenState = data.hiddenState || new Array(6).fill(0);
    return neural;
  }
}
