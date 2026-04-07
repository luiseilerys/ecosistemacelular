// ============================================================
//  SISTEMA DE MEMORIA EPISÓDICA
//  Almacena eventos pasados para consulta futura
// ============================================================

import { distance } from '../utils/helpers.js';

/**
 * Memoria episódica para recordar eventos importantes
 */
export class EpisodicMemory {
  constructor() {
    this.events = [];
    this.maxEvents = 15;
  }

  /**
   * Registra un nuevo evento
   * @param {string} type - Tipo de evento ('food', 'danger', 'hunt_success', etc.)
   * @param {number} x - Posición X del evento
   * @param {number} y - Posición Y del evento
   * @param {Object} context - Información adicional del evento
   */
  record(type, x, y, context = {}) {
    this.events.push({
      type,
      x,
      y,
      timestamp: performance.now(),
      strength: 1.0,
      context
    });

    // Mantener solo los eventos más recientes
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }
  }

  /**
   * Consulta eventos por tipo y proximidad
   * @param {string|null} type - Tipo de evento a buscar (null para todos)
   * @param {number} x - Posición X de búsqueda
   * @param {number} y - Posición Y de búsqueda
   * @param {number} radius - Radio de búsqueda
   * @param {number} maxAge - Edad máxima en ms (default: 60000)
   * @returns {Object|null} El evento más relevante o null
   */
  query(type, x, y, radius, maxAge = 60000) {
    const now = performance.now();
    let best = null;
    let bestScore = -1;

    for (const event of this.events) {
      // Filtrar por tipo
      if (type && event.type !== type) continue;
      
      // Filtrar por edad
      const age = now - event.timestamp;
      if (age > maxAge) continue;

      // Calcular score basado en distancia y decadencia temporal
      const dist = distance(x, y, event.x, event.y);
      const decay = Math.max(0, 1 - age / maxAge);
      const distanceFactor = 1 - dist / (radius || 200);
      const score = event.strength * decay * Math.max(0, distanceFactor);

      if (score > bestScore) {
        bestScore = score;
        best = { ...event, score };
      }
    }

    return best;
  }

  /**
   * Hereda memorias importantes de un padre
   * @param {EpisodicMemory} parent - Memoria del padre
   */
  inherit(parent) {
    if (!parent) return;

    // Heredar los 3 recuerdos más fuertes con intensidad reducida
    const sorted = [...parent.events]
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 3);

    for (const event of sorted) {
      this.events.push({
        ...event,
        strength: event.strength * 0.6,
        timestamp: performance.now()
      });
    }
  }

  /**
   * Obtiene todos los eventos
   */
  getAll() {
    return [...this.events];
  }

  /**
   * Limpia eventos antiguos
   */
  cleanup(maxAge = 120000) {
    const now = performance.now();
    this.events = this.events.filter(e => (now - e.timestamp) < maxAge);
  }

  /**
   * Serializa para guardado
   */
  toJSON() {
    return {
      events: this.events,
      maxEvents: this.maxEvents
    };
  }

  /**
   * Crea instancia desde JSON
   */
  static fromJSON(data) {
    const memory = new EpisodicMemory();
    memory.events = data.events || [];
    memory.maxEvents = data.maxEvents || 15;
    return memory;
  }
}
