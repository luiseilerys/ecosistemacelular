// ============================================================
//  SISTEMA DE PERSONALIDAD AVANZADO
//  Rasgos únicos de comportamiento con dinámicas complejas
// ============================================================

import { lerp, randomRange, clamp } from '../utils/helpers.js';

/**
 * Sistema de personalidad avanzado con rasgos dinámicos y evolución
 */
export class Personality {
  constructor(parent = null) {
    if (parent) {
      // Herencia con variación y correlaciones entre rasgos
      const variation = 0.25;
      
      this.caution = clamp(lerp(parent.caution, randomRange(0.3, 0.7), variation), 0, 1);
      this.optimism = clamp(lerp(parent.optimism, randomRange(0.3, 0.7), variation), 0, 1);
      this.stubbornness = clamp(lerp(parent.stubbornness, randomRange(0.2, 0.6), variation), 0, 1);
      this.empathy = clamp(lerp(parent.empathy, randomRange(0.3, 0.7), variation), 0, 1);
      this.creativity = clamp(lerp(parent.creativity, randomRange(0.2, 0.5), variation), 0, 1);
      this.routine = clamp(lerp(parent.routine, randomRange(0.3, 0.6), variation), 0, 1);
      
      // Nuevos rasgos avanzados
      this.resilience = clamp(lerp(parent.resilience || 0.5, randomRange(0.3, 0.7), variation), 0, 1);
      this.impulsivity = clamp(lerp(parent.impulsivity || 0.5, randomRange(0.2, 0.6), variation), 0, 1);
      this.cooperation = clamp(lerp(parent.cooperation || 0.5, randomRange(0.3, 0.7), variation), 0, 1);
      this.competitiveness = clamp(lerp(parent.competitiveness || 0.5, randomRange(0.2, 0.6), variation), 0, 1);
      this.adaptability = clamp(lerp(parent.adaptability || 0.5, randomRange(0.4, 0.8), variation), 0, 1);
      
      // Correlaciones entre rasgos heredados
      this.applyTraitCorrelations();
    } else {
      // Personalidad inicial aleatoria con correlaciones naturales
      this.caution = randomRange(0.2, 0.8);
      this.optimism = randomRange(0.3, 0.7);
      this.stubbornness = randomRange(0.1, 0.5);
      this.empathy = randomRange(0.2, 0.6);
      this.creativity = randomRange(0.1, 0.4);
      this.routine = randomRange(0.2, 0.6);
      
      // Nuevos rasgos avanzados
      this.resilience = randomRange(0.3, 0.7);
      this.impulsivity = randomRange(0.2, 0.6);
      this.cooperation = randomRange(0.3, 0.7);
      this.competitiveness = randomRange(0.2, 0.6);
      this.adaptability = randomRange(0.4, 0.8);
      
      // Aplicar correlaciones iniciales
      this.applyTraitCorrelations();
    }
    
    // Historial de decisiones para análisis de patrones
    this.decisionHistory = [];
    this.maxHistory = 20;
    
    // Tendencia de comportamiento emergente
    this.behavioralTrends = {
      aggression: 0.5,
      sociability: 0.5,
      exploration: 0.5
    };
  }

  /**
   * Aplica correlaciones naturales entre rasgos de personalidad
   */
  applyTraitCorrelations() {
    // La creatividad tiende a correlacionarse con baja rutina
    this.creativity = lerp(this.creativity, 1 - this.routine, 0.2);
    
    // La empatía correlaciona con cooperación
    this.cooperation = lerp(this.cooperation, this.empathy, 0.3);
    
    // El optimismo reduce la cautela ligeramente
    this.caution = lerp(this.caution, this.caution * (1 - this.optimism * 0.3), 0.15);
    
    // La competitividad aumenta con baja empatía
    this.competitiveness = lerp(this.competitiveness, 1 - this.empathy, 0.2);
    
    // La resiliencia reduce la impulsividad
    this.impulsivity = lerp(this.impulsivity, 1 - this.resilience, 0.25);
    
    // Clamp para mantener valores válidos
    for (const trait of ['caution', 'optimism', 'stubbornness', 'empathy', 'creativity', 
                         'routine', 'resilience', 'impulsivity', 'cooperation', 
                         'competitiveness', 'adaptability']) {
      this[trait] = clamp(this[trait], 0, 1);
    }
  }

  /**
   * Actualiza tendencias de comportamiento basadas en decisiones
   */
  updateBehavioralTrends(action, success) {
    const trendChanges = {
      flee: { aggression: -0.05, sociability: 0, exploration: -0.03 },
      eat: { aggression: 0.02, sociability: -0.01, exploration: 0 },
      reproduce: { aggression: 0, sociability: 0.03, exploration: 0 },
      symbiosis: { aggression: -0.03, sociability: 0.08, exploration: 0.02 },
      hunt: { aggression: 0.08, sociability: -0.02, exploration: 0.03 },
      forage: { aggression: 0, sociability: -0.01, exploration: 0.05 },
      wander: { aggression: 0, sociability: 0, exploration: 0.04 },
      investigate: { aggression: -0.02, sociability: 0.02, exploration: 0.06 }
    };

    const changes = trendChanges[action] || {};
    const modifier = success ? 1 : -0.5;

    for (const [trend, change] of Object.entries(changes)) {
      this.behavioralTrends[trend] = clamp(
        this.behavioralTrends[trend] + change * modifier * this.adaptability,
        0, 1
      );
    }

    // Guardar en historial
    this.decisionHistory.push({ action, success, timestamp: Date.now() });
    if (this.decisionHistory.length > this.maxHistory) {
      this.decisionHistory.shift();
    }
  }

  /**
   * Obtiene modificadores de decisión basados en personalidad
   */
  getDecisionModifiers(context) {
    const modifiers = {
      riskTaking: (1 - this.caution) * (1 + this.optimism * 0.5),
      socialBias: this.empathy * this.cooperation * (1 + this.sociabilityFromGenes(context) * 0.3),
      explorationDrive: this.creativity * (1 - this.routine) * this.adaptability,
      persistence: this.stubbornness * this.resilience,
      adaptability: this.adaptability * (1 - this.stubbornness * 0.5),
      impulsiveness: this.impulsivity * (1 - this.resilience * 0.5),
      competitiveEdge: this.competitiveness * (1 - this.cooperation * 0.3)
    };

    // Modificadores contextuales
    if (context && context.threatLevel) {
      modifiers.riskTaking *= (1 - context.threatLevel * this.caution);
    }
    if (context && context.socialContext) {
      modifiers.socialBias *= (1 + context.socialContext * this.empathy);
    }

    return modifiers;
  }

  /**
   * Helper para obtener sociabilidad desde genes (si están disponibles)
   */
  sociabilityFromGenes(context) {
    if (context && context.genes && context.genes.sociability) {
      return context.genes.sociability;
    }
    return 0.5; // Valor por defecto
  }

  /**
   * Analiza patrones de comportamiento recientes
   */
  analyzeBehaviorPatterns() {
    if (this.decisionHistory.length < 5) return null;

    const actionCounts = {};
    let successCount = 0;

    for (const record of this.decisionHistory) {
      actionCounts[record.action] = (actionCounts[record.action] || 0) + 1;
      if (record.success) successCount++;
    }

    const totalActions = this.decisionHistory.length;
    const dominantAction = Object.entries(actionCounts)
      .reduce((a, b) => a[1] > b[1] ? a : b)[0];

    return {
      dominantAction,
      actionDistribution: actionCounts,
      successRate: successCount / totalActions,
      variety: Object.keys(actionCounts).length / Math.min(8, totalActions),
      consistency: actionCounts[dominantAction] / totalActions
    };
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
      routine: this.routine,
      resilience: this.resilience,
      impulsivity: this.impulsivity,
      cooperation: this.cooperation,
      competitiveness: this.competitiveness,
      adaptability: this.adaptability,
      behavioralTrends: this.behavioralTrends,
      decisionHistory: this.decisionHistory.slice(-10)
    };
  }

  /**
   * Crea una instancia desde JSON
   */
  static fromJSON(data) {
    const p = new Personality();
    
    // Rasgos básicos
    p.caution = data.caution ?? 0.5;
    p.optimism = data.optimism ?? 0.5;
    p.stubbornness = data.stubbornness ?? 0.5;
    p.empathy = data.empathy ?? 0.5;
    p.creativity = data.creativity ?? 0.5;
    p.routine = data.routine ?? 0.5;
    
    // Nuevos rasgos (con fallback para datos antiguos)
    p.resilience = data.resilience ?? 0.5;
    p.impulsivity = data.impulsivity ?? 0.5;
    p.cooperation = data.cooperation ?? 0.5;
    p.competitiveness = data.competitiveness ?? 0.5;
    p.adaptability = data.adaptability ?? 0.5;
    
    // Tendencias y historial
    p.behavioralTrends = data.behavioralTrends || { aggression: 0.5, sociability: 0.5, exploration: 0.5 };
    p.decisionHistory = data.decisionHistory || [];
    
    return p;
  }
}
