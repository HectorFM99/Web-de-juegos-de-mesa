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
├── compose.yaml               # Orquestación con Docker Compose
└── sonar-project.properties   # Configuración de análisis estático SonarCloud
```

## 🚀 Cómo Ejecutar en Local

### Opción 1: Con Docker (Recomendado)
Asegúrate de tener Docker y Docker Compose instalados. Ejecuta desde la raíz del proyecto:

```sh
docker compose up --build
```

Abre en tu navegador: [http://localhost:8079](http://localhost:8079). Para detener el servidor, pulsa `Ctrl+C` o ejecuta `docker compose down`.

### Opción 2: Sin Docker (Archivos estáticos)
Al ser una aplicación web estática pura (HTML, CSS y JS vainilla), puedes abrir directamente `index.html` en cualquier navegador moderno o servirla con cualquier servidor web estático (como Live Server en VS Code).

---

## 🛠️ Desarrollo y Calidad de Código

- **Linters:** Se utiliza ESLint para JavaScript y HTMLHint para validación HTML (`npm run lint`).
- **Integración Continua:** GitHub Actions valida linters, construcción de Docker y análisis de calidad en cada `push` y Pull Request.
- **Análisis Estático (SonarCloud):** Configurado para revisar la calidad del código, mantenibilidad y seguridad.
