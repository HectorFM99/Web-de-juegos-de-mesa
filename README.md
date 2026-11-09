# La Sobremesa

**La Sobremesa** es una web moderna de juegos de mesa para navegador. Reúne partidas clásicas en un catálogo interactivo con búsqueda y filtros instantáneos, dentro de una interfaz de estilo rústico y acogedor. Cada juego se ejecuta directamente en el navegador de forma fluida y sin dependencias pesadas.

## 🎲 Juegos Disponibles

- **Ajedrez:** Partida local para dos personas con representación de piezas y lógica de movimientos.
- **Damas:** Partida local para dos personas con mecánicas de salto, captura y coronación.
- **Solitario (Klondike):** Juego de cartas clásico para una persona con gestión de baraja y fundaciones.
- **Tres en Raya:** Partida clásica de estrategia rápida para dos personas.
- **Conecta 4:** Duelo de fichas en vertical para conectar cuatro en línea.
- **Memoria:** Reto de concentración para encontrar las 8 parejas ocultas.

## 📁 Estructura del Proyecto

```text
.
├── index.html                 # Página principal y catálogo de juegos
├── html/                      # Vistas individuales para cada juego
├── css/
│   ├── style.css              # Estilos del catálogo y página principal
│   ├── game.css               # Estilos y diseño de tableros y partidas
│   └── theme.css              # Gestión de temas (claro/oscuro)
├── js/
│   ├── script.js              # Lógica de búsqueda y filtrado de juegos
│   ├── game.js                # Lógica interactiva de las partidas
│   ├── theme.js               # Control de preferencias de tema
│   └── contador.js            # Utilidades de conteo
├── Dockerfile                 # Configuración de Nginx para producción
├── compose.yaml               # Orquestación y límites de recursos
└── sonar-project.properties   # Configuración de análisis estático SonarCloud
```

## 🐳 Uso de Docker y Arquitectura en el Proyecto

En este proyecto, **Docker Compose** orquesta tres servicios principales:
1. **Frontend (`frontend`):** Aplicación web estática servida mediante un contenedor ligero basado en **Nginx (`nginx:alpine`)**.
2. **Backend (`backend`):** API robusta construida con **NestJS** y **TypeScript**, comunicándose mediante **Prisma ORM**.
3. **Base de Datos (`postgres`):** Base de datos relacional **PostgreSQL 16** optimizada y persistente.

- Permite servir el contenido y levantar la API de forma idéntica en cualquier entorno de producción.
- Incorpora políticas de seguridad estrictas, como asegurar que los archivos estáticos tengan permisos de solo lectura y contenedores aislados.
- Se define en `compose.yaml` con límites de recursos (CPU y memoria) y políticas de reinicio automático, garantizando estabilidad y rendimiento.

## 🔍 Análisis de Calidad con SonarQube / SonarCloud

**SonarCloud** se ha integrado en el flujo de trabajo del proyecto para realizar **análisis estáticos de código** automatizados en cada integración continua (CI) mediante GitHub Actions.
- Evalúa de forma continua la calidad del código, detectando posibles *code smells*, duplicidades y vulnerabilidades de seguridad.
- Actúa como puerta de calidad (*Quality Gate*) obligatoria, impidiendo que cambios con deficiencias entren en la rama principal.
- Ayuda a mantener buenas prácticas de desarrollo y un estándar profesional en toda la base de código frontend.

## 🛠️ Desarrollo

- **Linters:** Validación estricta de HTML (`HTMLHint`) y JavaScript (`ESLint`) ejecutados localmente y en CI (`npm run lint`).
- **Integración Continua:** GitHub Actions automatiza la verificación de linters, pruebas, compilación de contenedores y validación de calidad.
