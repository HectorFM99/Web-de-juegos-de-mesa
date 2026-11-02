# La Sobremesa

La Sobremesa es una web de juegos de mesa para navegador. Reúne partidas sencillas en un catálogo con búsqueda y filtros, dentro de una interfaz de estilo rústico. Cada juego se abre en su propia página y funciona en el navegador, sin instalar dependencias de la aplicación.

## Juegos disponibles

- **Ajedrez:** partida local para dos personas con movimientos básicos de las piezas.
- **Damas:** partida local para dos personas, con capturas y coronación.
- **Solitario:** Klondike para una persona, con robo de cartas y fundaciones.
- **Tres en raya:** partida local para dos personas.
- **Conecta 4:** partida local para dos personas.
- **Memoria:** encuentra las ocho parejas de cartas.

En ajedrez aún no están implementados el enroque, la captura al paso ni la validación de jaque y jaque mate.

## Ejecutar en local

### Con Docker

Con Docker Compose instalado, ejecuta desde la carpeta raíz:

```sh
docker compose up --build
```

Abre [http://localhost:8079](http://localhost:8079). Para detener el servidor, pulsa `Ctrl+C` o ejecuta `docker compose down` en otra terminal.

### Sin Docker

Abre `index.html` en un navegador moderno. La web es estática y no necesita compilación ni instalación de paquetes. Las fuentes tipográficas se cargan desde Google Fonts cuando hay conexión a Internet; si no, se utilizan fuentes locales de respaldo.

## Estructura del proyecto

```text
.
├── index.html                 # Catálogo y página principal
├── html/                      # Una página por juego
├── css/
│   ├── style.css              # Estilos de la página principal
│   ├── game.css               # Estilos compartidos por los juegos
│   └── theme.css              # Tema claro y oscuro
├── js/
│   ├── script.js              # Búsqueda y filtros del catálogo
│   ├── game.js                # Lógica de las partidas
│   └── theme.js               # Selector de tema y preferencia guardada
├── .github/workflows/         # Análisis automático en GitHub Actions
└── sonar-project.properties   # Alcance de análisis de SonarQube
```

## SonarQube

El análisis estático se ejecuta con el workflow de GitHub Actions en cada `push`. Revisa los problemas que detecten los analizadores y el perfil de calidad configurado en la instancia, incluidos bugs, vulnerabilidades, code smells y duplicación. El workflow espera el resultado del Quality Gate.

Para conectarlo:

1. Crea en SonarQube un proyecto con la clave `la-sobremesa`.
2. Genera un token de análisis para ese proyecto.
3. En el repositorio de GitHub, abre **Settings → Secrets and variables → Actions**.
4. Guarda el token como el secreto `SONAR_TOKEN`.
5. Añade la URL de la instancia como la variable `SONAR_HOST_URL`.
6. Sube un cambio al repositorio para iniciar el primer análisis.

El token y la URL del servidor se configuran en GitHub y no se guardan en el código. Para analizar desde local, instala [SonarScanner CLI](https://docs.sonarsource.com/sonarqube-server/analyzing-source-code/scanners/sonarscanner/), configura `SONAR_TOKEN` y `SONAR_HOST_URL` en el entorno y ejecuta `sonar-scanner` desde la raíz.

El proyecto todavía no tiene pruebas automatizadas ni informes de cobertura; por tanto, SonarQube podrá revisar el código, pero no calcular cobertura de pruebas.
