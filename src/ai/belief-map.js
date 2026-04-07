// ============================================================
//  SISTEMA DE MAPA DE CREENCIAS
//  Zonas memorizadas del entorno
// ============================================================

import { distance, clamp } from '../utils/helpers.js';

/**
 * Mapa de creencias para recordar zonas importantes
 */
export class BeliefMap {
  constructor() {
    this.zones = new Map();
  }

  /**
   * Registra una observación en una zona
   */
  observe(type, x, y, intensity) {
    const key = `${type}_${Math.floor(x / 150)}_${Math.floor(y / 150)}`;
    
    let zone = this.zones.get(key);
    if (!zone) {
      zone = { type, x, y, intensity: 0, timestamp: 0, visits: 0 };
    }

    // Actualizar intensidad con promedio ponderado
    zone.intensity = clamp(zone.intensity * 0.9 + intensity * 0.1, 0, 1);
    zone.timestamp = performance.now();
    zone.visits++;

    this.zones.set(key, zone);
  }

  /**
   * Encuentra la mejor zona de un tipo dentro de un radio
   */
  bestZone(type, cx, cy, radius) {
    let best = null;
    let bestScore = -1;

    const cellRadius = Math.ceil((radius || 200) / 150);
    const ccx = Math.floor(cx / 150);
    const ccy = Math.floor(cy / 150);

    for (const [key, zone] of this.zones) {
      if (zone.type !== type) continue;

      // Verificar si está dentro del radio de celdas
      const dx = Math.floor(zone.x / 150) - ccx;
      const dy = Math.floor(zone.y / 150) - ccy;
      if (Math.abs(dx) > cellRadius || Math.abs(dy) > cellRadius) continue;

      // Calcular score basado en intensidad, edad y distancia
      const age = (performance.now() - zone.timestamp) / 30000;
      const distFactor = 1 - distance(cx, cy, zone.x, zone.y) / (radius || 200);
      const score = zone.intensity * Math.max(0, 1 - age) * Math.max(0, distFactor) * zone.visits * 0.1;

      if (score > bestScore) {
        bestScore = score;
        best = zone;
      }
    }

    return best;
  }

  /**
   * Hereda creencias de un padre
   */
  inherit(parent) {
    if (!parent) return;

    for (const [key, zone] of parent.zones) {
      this.zones.set(key, {
        ...zone,
        intensity: zone.intensity * 0.5,
        visits: Math.floor(zone.visits * 0.5)
      });
    }
  }

  /**
   * Obtiene todas las zonas
   */
  getAllZones() {
    return Array.from(this.zones.values());
  }

  /**
   * Limpia zonas antiguas
   */
  cleanup(maxAge = 60000) {
    const now = performance.now();
    for (const [key, zone] of this.zones) {
      if ((now - zone.timestamp) > maxAge) {
        this.zones.delete(key);
      }
    }
  }

  /**
   * Serializa para guardado
   */
  toJSON() {
    return {
      zones: Array.from(this.zones.entries())
    };
  }

  /**
   * Crea instancia desde JSON
   */
  static fromJSON(data) {
    const beliefs = new BeliefMap();
    beliefs.zones = new Map(data.zones || []);
    return beliefs;
  }
}
