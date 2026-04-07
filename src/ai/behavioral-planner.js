// ============================================================
//  PLANIFICADOR CONDUCTUAL
//  Secuencias de intención y planificación de acciones
// ============================================================

/**
 * Planificador para secuencias de acciones complejas
 */
export class BehavioralPlanner {
  constructor() {
    this.currentPlan = null;
    this.planSteps = [];
    this.planIndex = 0;
    this.lastSuccessfulAction = null;
    this.repeatedFailures = 0;
  }

  /**
   * Obtiene la acción actual del plan
   */
  getCurrentAction() {
    if (this.currentPlan && this.planIndex < this.planSteps.length) {
      return this.planSteps[this.planIndex];
    }
    return null;
  }

  /**
   * Avanza el plan según el resultado
   */
  advancePlan(success) {
    if (success) {
      // Éxito: guardar acción y avanzar
      this.lastSuccessfulAction = this.planSteps[this.planIndex]?.action;
      this.repeatedFailures = 0;
      this.planIndex++;

      // Plan completado
      if (this.planIndex >= this.planSteps.length) {
        this.currentPlan = null;
      }
    } else {
      // Fallo: aumentar contador de fallos
      this.repeatedFailures++;

      // Si muchos fallos, aumentar urgencia
      if (this.repeatedFailures > 3) {
        this.repeatedFailures = 0;
        const currentStep = this.planSteps[this.planIndex];
        if (currentStep) {
          currentStep.urgency = Math.min(1, currentStep.urgency + 0.3);
        }
      }
    }
  }

  /**
   * Crea un nuevo plan
   */
  createPlan(name, steps) {
    this.currentPlan = name;
    this.planSteps = steps.map((action, index) => ({
      action,
      urgency: 0.5 + (index === 0 ? 0.3 : 0),
      createdAt: performance.now()
    }));
    this.planIndex = 0;
  }

  /**
   * Cancela el plan actual
   */
  cancelPlan() {
    this.currentPlan = null;
    this.planSteps = [];
    this.planIndex = 0;
  }

  /**
   * Hereda tendencias de planificación del padre
   */
  inherit(parent) {
    if (!parent) return;

    this.lastSuccessfulAction = parent.lastSuccessfulAction;
    this.repeatedFailures = Math.floor(parent.repeatedFailures * 0.5);
    
    // Posiblemente heredar patrones de planificación exitosos
    if (parent.currentPlan && parent.planSteps.length > 0) {
      // Copiar parcialmente el plan si estaba funcionando
      if (parent.repeatedFailures < 2) {
        this.currentPlan = parent.currentPlan;
        this.planSteps = parent.planSteps.slice(parent.planIndex).map(s => ({
          ...s,
          urgency: s.urgency * 0.7
        }));
        this.planIndex = 0;
      }
    }
  }

  /**
   * Obtiene estadísticas del plan
   */
  getStats() {
    return {
      hasPlan: this.currentPlan !== null,
      planName: this.currentPlan,
      progress: this.planSteps.length > 0 
        ? `${this.planIndex}/${this.planSteps.length}` 
        : '0/0',
      failures: this.repeatedFailures,
      lastSuccess: this.lastSuccessfulAction
    };
  }

  /**
   * Serializa para guardado
   */
  toJSON() {
    return {
      currentPlan: this.currentPlan,
      planSteps: this.planSteps,
      planIndex: this.planIndex,
      lastSuccessfulAction: this.lastSuccessfulAction,
      repeatedFailures: this.repeatedFailures
    };
  }

  /**
   * Crea instancia desde JSON
   */
  static fromJSON(data) {
    const planner = new BehavioralPlanner();
    planner.currentPlan = data.currentPlan || null;
    planner.planSteps = data.planSteps || [];
    planner.planIndex = data.planIndex || 0;
    planner.lastSuccessfulAction = data.lastSuccessfulAction || null;
    planner.repeatedFailures = data.repeatedFailures || 0;
    return planner;
  }
}
