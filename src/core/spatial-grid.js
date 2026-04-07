// ============================================================
//  SISTEMA DE REJILLA ESPACIAL (SPATIAL GRID)
//  Optimización para consultas de vecinos
// ============================================================

/**
 * Rejilla espacial para optimizar consultas de proximidad
 */
export class SpatialGrid {
  constructor(cellSize = 100) {
    this.cellSize = cellSize;
    this.map = new Map();
  }

  /**
   * Limpia la rejilla
   */
  clear() {
    this.map.clear();
  }

  /**
   * Genera una clave única para una celda
   */
  cellKey(cx, cy) {
    return cx * 100003 + cy;
  }

  /**
   * Inserta un objeto en la rejilla
   */
  insert(obj) {
    const cx = Math.floor(obj.x / this.cellSize);
    const cy = Math.floor(obj.y / this.cellSize);
    const key = this.cellKey(cx, cy);
    
    if (!this.map.has(key)) {
      this.map.set(key, []);
    }
    this.map.get(key).push(obj);
  }

  /**
   * Consulta objetos dentro de un radio
   */
  query(x, y, radius) {
    const result = [];
    const cellRadius = Math.ceil(radius / this.cellSize);
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);

    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dy = -cellRadius; dy <= cellRadius; dy++) {
        const bucket = this.map.get(this.cellKey(cx + dx, cy + dy));
        if (bucket) {
          for (const obj of bucket) {
            result.push(obj);
          }
        }
      }
    }
    return result;
  }
}
