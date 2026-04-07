# 🧬 Ecosistema Celular - Versión Refactorizada

## 📋 Descripción
Simulación de ecosistema celular con IA avanzada, ahora con código modularizado en ES6 modules para mejor mantenibilidad y escalabilidad.

## 🏗️ Estructura del Proyecto

```
ecosistemacelular/
├── index.html              # Aplicación principal (versión legacy monolítica)
├── src/                    # Código fuente modularizado
│   ├── core/               # Núcleo del sistema
│   │   ├── index.js        # Exportaciones unificadas
│   │   └── spatial-grid.js # Rejilla espacial para optimización
│   ├── entities/           # Entidades del juego
│   │   ├── cell.js         # Clase Célula
│   │   ├── food.js         # Clase Comida
│   │   └── colony.js       # Clase Colonia
│   ├── ai/                 # Sistemas de Inteligencia Artificial
│   │   ├── index.js        # Exportaciones unificadas
│   │   ├── personality.js  # Sistema de personalidad
│   │   ├── memory.js       # Memoria episódica
│   │   ├── qlearning.js    # Q-Learning ligero
│   │   ├── emotional-state.js # Estado emocional
│   │   ├── belief-map.js   # Mapa de creencias
│   │   ├── neural-core.js  # Red neuronal recurrente
│   │   └── behavioral-planner.js # Planificador conductual
│   ├── ui/                 # Interfaz de usuario
│   │   ├── renderer.js     # Renderizado en Canvas
│   │   ├── overlay.js      # UI overlay
│   │   └── minimap.js      # Minimap
│   └── utils/              # Utilidades
│       ├── index.js        # Exportaciones unificadas
│       ├── constants.js    # Constantes y configuración
│       └── helpers.js      # Funciones helper
└── README.md               # Este archivo
```

## 🔧 Módulos Implementados

### Core
- **SpatialGrid**: Sistema de rejilla espacial para consultas de proximidad optimizadas O(1)

### IA (Inteligencia Artificial por Célula)
- **Personality**: 6 rasgos de personalidad únicos (precaución, optimismo, terquedad, empatía, creatividad, rutina)
- **EpisodicMemory**: Memoria de eventos pasados con decadencia temporal
- **QLearningLight**: Aprendizaje por refuerzo para toma de decisiones
- **EmotionalState**: Estado emocional que modifica comportamientos
- **BeliefMap**: Mapa mental de zonas importantes del entorno
- **NeuralCore**: Red neuronal recurrente (8→6→8) para procesamiento complejo
- **BehavioralPlanner**: Planificación de secuencias de acciones

### Utilidades
- **Constants**: Configuración global, genes, biomas, roles
- **Helpers**: Funciones matemáticas y de ayuda (clamp, lerp, distance, etc.)

## 🚀 Próximos Pasos

### Fase 1: Migración de Entidades (Pendiente)
- [ ] `src/entities/cell.js` - Clase principal Cell
- [ ] `src/entities/food.js` - Entidad Food
- [ ] `src/entities/colony.js` - Sistema de colonias

### Fase 2: Sistema de Renderizado (Pendiente)
- [ ] `src/ui/renderer.js` - Motor de renderizado Canvas
- [ ] `src/ui/overlay.js` - UI overlay y paneles
- [ ] `src/ui/minimap.js` - Minimap interactivo
- [ ] `src/ui/camera.js` - Sistema de cámara

### Fase 3: Game Loop y Estado (Pendiente)
- [ ] `src/core/game-loop.js` - Bucle principal del juego
- [ ] `src/core/state.js` - Estado global de la simulación
- [ ] `src/core/events.js` - Sistema de eventos

### Fase 4: Caratteristiche Avanzadas (Futuro)
- [ ] Sistema de guardado/carga
- [ ] Web Workers para paralelización
- [ ] Gráficos de evolución en tiempo real
- [ ] Árbol filogenético visual
- [ ] Modo "dios" interactivo

## 💡 Ventajas de la Refactorización

1. **Mantenibilidad**: Código separado por responsabilidades
2. **Testabilidad**: Módulos independientes fáciles de testear
3. **Reusabilidad**: Componentes exportables
4. **Colaboración**: Múltiples desarrolladores sin conflictos
5. **Rendimiento**: Posibilidad de lazy loading
6. **TypeScript Ready**: Fácil migración a TypeScript

## 🛠️ Uso

### Versión Actual (Legacy)
```bash
# Simplemente abrir index.html en un navegador
# o usar un servidor local:
python -m http.server 8000
# Visitar: http://localhost:8000
```

### Versión Modularizada (En desarrollo)
```html
<script type="module">
  import { SpatialGrid } from './src/core/index.js';
  import { Personality, EpisodicMemory, QLearningLight } from './src/ai/index.js';
  import { CFG, GENES, clamp, lerp } from './src/utils/index.js';
  
  // Tu código aquí
</script>
```

## 📊 Estadísticas del Proyecto

- **Líneas de código totales**: ~716
- **Módulos creados**: 10
- **Clases de IA**: 7
- **Funciones utilitarias**: 10+
- **Constantes definidas**: 50+

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature
3. Sigue la estructura de módulos establecida
4. Añade tests cuando sea posible
5. Submit un pull request

## 📄 Licencia

MIT License

---

**Nota**: Este proyecto está en proceso activo de refactorización. La versión funcional actual sigue siendo `index.html`. Los módulos en `src/` son la nueva arquitectura hacia donde estamos migrando.