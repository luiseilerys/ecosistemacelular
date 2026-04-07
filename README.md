# 🧬 Ecosistema Celular - Versión Refactorizada

## 📋 Descripción
Simulación de ecosistema celular con IA avanzada, ahora con código modularizado en ES6 modules para mejor mantenibilidad y escalabilidad.

## 🏗️ Estructura del Proyecto

```
ecosistemacelular/
├── index.html              # Aplicación principal (versión legacy monolítica)
├── index-modular.html      # Nueva versión modularizada (recomendada)
├── src/                    # Código fuente modularizado
│   ├── main.js             # Punto de entrada principal
│   ├── core/               # Núcleo del sistema
│   │   ├── index.js        # Exportaciones unificadas
│   │   ├── spatial-grid.js # Rejilla espacial para optimización
│   │   └── ecosystem.js    # Motor principal del ecosistema
│   ├── entities/           # Entidades del juego
│   │   ├── index.js        # Exportaciones unificadas
│   │   ├── cell.js         # Clase Célula con IA completa
│   │   ├── food.js         # Clase Comida
│   │   ├── biome.js        # Sistema de biomas
│   │   └── colony.js       # Sistema de colonias
│   ├── ai/                 # Sistemas de Inteligencia Artificial
│   │   ├── index.js        # Exportaciones unificadas
│   │   ├── personality.js  # Sistema de personalidad (6 rasgos)
│   │   ├── memory.js       # Memoria episódica
│   │   ├── qlearning.js    # Q-Learning ligero
│   │   ├── emotional-state.js # Estado emocional
│   │   ├── belief-map.js   # Mapa de creencias
│   │   ├── neural-core.js  # Red neuronal recurrente
│   │   └── behavioral-planner.js # Planificador conductual
│   ├── ui/                 # Interfaz de usuario
│   │   ├── index.js        # Exportaciones unificadas
│   │   └── ui-manager.js   # Gestor de UI unificado
│   └── utils/              # Utilidades
│       ├── index.js        # Exportaciones unificadas
│       ├── constants.js    # Constantes y configuración
│       └── helpers.js      # Funciones helper
└── README.md               # Este archivo
```

## 🔧 Módulos Implementados

### Core (Núcleo)
- **SpatialGrid**: Sistema de rejilla espacial para consultas de proximidad optimizadas O(1)
- **Ecosystem**: Motor principal que gestiona células, comida, biomas y colonias

### Entidades
- **Cell**: Célula autónoma con IA completa, genes, emociones y aprendizaje
- **Food**: Fuentes de alimento con regeneración en biomas fértiles
- **Biome**: 4 tipos de biomas (fértil, tóxico, radiante, estable)
- **Colony**: Sistema de colonias con roles, feromonas y gestión de miembros

### IA (Inteligencia Artificial por Célula)
- **Personality**: 6 rasgos de personalidad únicos (precaución, optimismo, terquedad, empatía, creatividad, rutina)
- **EpisodicMemory**: Memoria de eventos pasados con decadencia temporal (máx 15 eventos)
- **QLearningLight**: Aprendizaje por refuerzo para toma de decisiones
- **EmotionalState**: 6 emociones que modifican comportamientos (energía, estrés, confianza, curiosidad, frustración, contentamiento)
- **BeliefMap**: Mapa mental de zonas importantes del entorno
- **NeuralCore**: Red neuronal recurrente (8→6→8) para procesamiento complejo
- **BehavioralPlanner**: Planificación de secuencias de acciones con reevaluación dinámica

### UI (Interfaz de Usuario)
- **UIManager**: Gestor unificado de estadísticas, panel de genoma, logs, minimapa y controles

### Utilidades
- **Constants**: Configuración global, 11 genes, biomas, roles
- **Helpers**: Funciones matemáticas y de ayuda (clamp, lerp, distance, randomRange, etc.)

## 🚀 Ejecución

### Versión Modularizada (Recomendada)
```bash
# Usar servidor local (requerido para ES6 modules):
python -m http.server 8000
# Visitar: http://localhost:8000/index-modular.html
```

### Versión Legacy (Monolítica)
```bash
# Funciona sin servidor:
# Abrir index.html directamente en el navegador
```

## 💡 Ventajas de la Refactorización

1. **Mantenibilidad**: Código separado por responsabilidades (22 módulos)
2. **Testabilidad**: Módulos independientes fáciles de testear unitariamente
3. **Reusabilidad**: Componentes exportables vía ES6 modules
4. **Colaboración**: Múltiples desarrolladores sin conflictos de merge
5. **Rendimiento**: Posibilidad de lazy loading y code splitting
6. **TypeScript Ready**: Fácil migración futura a TypeScript
7. **Serialización Completa**: Todos los objetos soportan toJSON()/fromJSON() para guardado/carga

## 📊 Estadísticas del Proyecto

| Métrica | Valor |
|---------|-------|
| Líneas de código totales | ~3,469 |
| Módulos JavaScript | 22 |
| Clases de IA | 7 |
| Entidades principales | 4 (Cell, Food, Biome, Colony) |
| Genes implementados | 11 |
| Rasgos de personalidad | 6 |
| Emociones | 6 |
| Biomas | 4 |
| Roles de célula | 5 |

## 🎮 Características de Simulación

### Sistema Genético
- 11 genes heredables con mutación: velocidad, tamaño, percepción, agresividad, sociabilidad, metabolismo, tasa de mutación, reproducción, curiosidad, defensa, paciencia

### Comportamientos Emergentes
- Búsqueda de alimento, huida de depredadores, reproducción sexual/asexual, formación de colonias, socialización, exploración, descanso

### Aprendizaje
- Q-Learning adaptativo
- Red neuronal que evoluciona con mutaciones
- Memoria episódica que influye en decisiones

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Sigue la estructura de módulos establecida
4. Añade tests cuando sea posible
5. Submit un pull request

## 📄 Licencia

MIT License

---

**Estado**: ✅ Refactorización completada - Versión modular funcional en `index-modular.html`