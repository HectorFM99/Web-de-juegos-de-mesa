// c8 genera las rutas del lcov relativas a backend/ (p. ej. "src/main.ts").
// SonarQube analiza desde la raíz del repositorio, así que las prefijamos con "backend/".
const fs = require('node:fs');
const path = require('node:path');

const lcovPath = path.join(__dirname, '..', 'coverage', 'lcov.info');
const content = fs.readFileSync(lcovPath, 'utf8');
const fixed = content.replace(
  /^SF:(?:.*[\\/])?src[\\/](.*)$/gm,
  (_, file) => `SF:backend/src/${file.replace(/\\/g, '/')}`,
);
fs.writeFileSync(lcovPath, fixed);
