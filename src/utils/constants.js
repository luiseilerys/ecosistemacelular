// ============================================================
//  CONFIGURACIÓN Y CONSTANTES
// ============================================================

export const CFG = {
  WS: 4000, IC: 35, MC: 350, MF: 600, FSR: 0.7,
  MB: 0.018, SC: 0.0006, MC2: 0.0015, AE: 0.003, ME: 1,
  RE: 60, RC: 25, EFF: 24, EFK: 30, HSB: 1.8, DT: 0.1,
  GS: 100, LM: 50
};

export const GENES = {
  speed: { l: 'Velocidad', c: '#42a5f5', n: 0.3, x: 3.0 },
  size: { l: 'Tamaño', c: '#ab47bc', n: 0.2, x: 1.0 },
  senseRange: { l: 'Percepción', c: '#66bb6a', n: 60, x: 280 },
  aggression: { l: 'Agresividad', c: '#ef5350', n: 0.0, x: 1.0 },
  sociability: { l: 'Sociabilidad', c: '#ffa726', n: 0.0, x: 1.0 },
  metabolism: { l: 'Metabolismo', c: '#ffee58', n: 0.2, x: 1.3 },
  mutationRate: { l: 'Tasa Mutación', c: '#ec407a', n: 0.02, x: 0.4 },
  symbiosis: { l: 'Simbiosis', c: '#ff7043', n: 0.0, x: 1.0 },
  defense: { l: 'Defensa', c: '#78909c', n: 0.0, x: 1.0 },
  reproduction: { l: 'Reproducción', c: '#26c6da', n: 0.2, x: 1.0 },
  curiosity: { l: 'Curiosidad', c: '#ba68c8', n: 0.1, x: 1.0 },
  patience: { l: 'Paciencia', c: '#4db6ac', n: 0.1, x: 1.0 }
};

export const GNAME = Object.keys(GENES);

export const BIOMES = {
  fertile: { c: 'rgba(50,200,100,0.06)', e: 1.4, m: 0.9, l: '🌿Fértil' },
  toxic: { c: 'rgba(200,50,50,0.06)', e: 0.6, m: 1.3, l: '☢️Tóxico' },
  radiant: { c: 'rgba(255,255,100,0.05)', e: 1.1, m: 1.0, l: '☀️Radiante' },
  stable: { c: 'rgba(100,100,200,0.04)', e: 1.0, m: 1.0, l: '⚖️Estable' }
};

export const ROLES = {
  SCOUT: { c: '#42a5f5', l: 'Explorador', i: '🔍', m: { speed: 1.3, sense: 1.4, size: 0.8 } },
  WORKER: { c: '#66bb6a', l: 'Obrero', i: '⚒️', m: { metab: 0.8, size: 1.1 } },
  DEFENDER: { c: '#ef5350', l: 'Defensor', i: '🛡️', m: { agg: 1.4, size: 1.2 } },
  BREEDER: { c: '#ec407a', l: 'Reproductor', i: '🧬', m: { repro: 1.5, speed: 0.7 } },
  SIGNALER: { c: '#ffa726', l: 'Señalizador', i: '📡', m: { symb: 1.5, sense: 1.2 } }
};

export const UCOL = {
  flee: '#ef5350',
  eat: '#66bb6a',
  reproduce: '#ec407a',
  symbiosis: '#ffab40',
  hunt: '#ff1744',
  joinColony: '#7c4dff',
  forage: '#a5d6a7',
  wander: '#78909c',
  investigate: '#ba68c8',
  defend: '#42a5f5'
};
