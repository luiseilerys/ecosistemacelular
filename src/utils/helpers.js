// ============================================================
//  UTILIDADES MATEMÁTICAS Y DE AYUDA
// ============================================================

/**
 * Clampa un valor entre mínimo y máximo
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Interpolación lineal entre dos valores
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Calcula la distancia entre dos puntos
 */
export function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

/**
 * Número aleatorio entre min y max
 */
export function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

/**
 * Convierte grados a radianes
 */
export function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

/**
 * Convierte radianes a grados
 */
export function radToDeg(radians) {
  return radians * 180 / Math.PI;
}

/**
 * Ángulo entre dos puntos en radianes
 */
export function angleBetween(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * Normaliza un vector
 */
export function normalize(x, y) {
  const len = Math.hypot(x, y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: x / len, y: y / len };
}

/**
 * Limita la magnitud de un vector
 */
export function limitMagnitude(x, y, max) {
  const len = Math.hypot(x, y);
  if (len <= max) return { x, y };
  return { x: (x / len) * max, y: (y / len) * max };
}
