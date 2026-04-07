// ============================================================
//  SISTEMA DE ESTADO EMOCIONAL
//  Las emociones afectan la toma de decisiones
// ============================================================

import { clamp, lerp } from '../utils/helpers.js';

/**
 * Estado emocional que influye en el comportamiento
 */
export class EmotionalState {
  constructor() {
    this.energy = 0.5;        // Nivel de vitalidad
    this.stress = 0.0;        // Nivel de estrés
    this.confidence = 0.5;    // Confianza en sí misma
    this.curiosity = 0.3;     // Deseo de explorar
    this.frustration = 0.0;   // Frustración por fallos
    this.contentment = 0.3;   // Satisfacción general
  }

  /**
   * Actualiza el estado emocional basado en condiciones actuales
   */
  update(hunger, threats, recentSuccess, colonyBonus) {
    // La energía depende del hambre
    this.energy = clamp(this.energy * 0.95 + (1 - hunger) * 0.05, 0, 1);

    // El estrés aumenta con amenazas
    const stressTarget = threats.length > 0 
      ? Math.min(1, threats.length * 0.3 + (threats[0]?.danger || 0.5))
      : 0;
    this.stress = lerp(this.stress, stressTarget, 0.05);

    // La confianza cambia con éxitos recientes
    this.confidence = clamp(
      this.confidence * 0.98 + (recentSuccess ? 0.08 : -0.02),
      0, 1
    );

    // La curiosidad aumenta cuando está contenta y sin estrés
    this.curiosity = lerp(
      this.curiosity,
      this.contentment > 0.5 && this.stress < 0.3 ? 0.8 : 0.2,
      0.03
    );

    // La frustración aumenta con fallos repetidos
    this.frustration = clamp(
      this.frustration * 0.95 + (recentSuccess === false ? 0.1 : -0.03),
      0, 1
    );

    // El contentamiento depende de energía, colonia y estrés
    this.contentment = clamp(
      this.contentment * 0.97 +
      (colonyBonus ? 0.03 : 0) +
      (1 - hunger) * 0.02 -
      this.stress * 0.02,
      0, 1
    );
  }

  /**
   * Obtiene modificadores emocionales para cada acción
   */
  modifiers() {
    return {
      flee: 1 + this.stress * 1.2 - this.confidence * 0.3,
      eat: 1 + (1 - this.energy) * 0.5 + this.frustration * 0.3,
      reproduce: 1 + this.contentment * 0.5 - this.stress * 0.4,
      symbiosis: 1 + (1 - this.stress) * this.contentment * 0.4 - this.stress * 0.2,
      hunt: 1 + this.confidence * 0.6 - this.stress * 0.3,
      forage: 1 + this.curiosity * 0.5 + this.frustration * 0.3,
      wander: 1 + this.curiosity * 0.3 - this.frustration * 0.2,
      investigate: 1 + this.curiosity * 0.8 - this.stress * 0.4,
      defend: 1 + this.confidence * 0.5,
      joinColony: 1 + (1 - this.stress) * 0.3
    };
  }

  /**
   * Obtiene la emoción dominante
   */
  getDominantEmotion() {
    const emotions = [
      { name: 'energy', value: this.energy, label: '⚡ Vital' },
      { name: 'stress', value: this.stress, label: '😰 Estresado' },
      { name: 'confidence', value: this.confidence, label: '💪 Confiado' },
      { name: 'curiosity', value: this.curiosity, label: '🔍 Curioso' },
      { name: 'frustration', value: this.frustration, label: '😤 Frustrado' },
      { name: 'contentment', value: this.contentment, label: '😊 Contento' }
    ];

    return emotions.reduce((a, b) => a.value > b.value ? a : b);
  }

  /**
   * Serializa para guardado
   */
  toJSON() {
    return {
      energy: this.energy,
      stress: this.stress,
      confidence: this.confidence,
      curiosity: this.curiosity,
      frustration: this.frustration,
      contentment: this.contentment
    };
  }

  /**
   * Crea instancia desde JSON
   */
  static fromJSON(data) {
    const emo = new EmotionalState();
    Object.assign(emo, data);
    return emo;
  }
}
