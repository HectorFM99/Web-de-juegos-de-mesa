import js from "@eslint/js";
import globals from "globals";

export default [
  // Reglas recomendadas de ESLint: errores típicos
  js.configs.recommended,

  // El JavaScript de la web se ejecuta en el navegador
  {
    files: ["js/**/*.js"],
    languageOptions: {
      sourceType: "script",
      globals: globals.browser,
    },
  },

  // Los tests se ejecutan con Node.js
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: globals.node,
    },
  },

  // Nuestras reglas de estilo
  {
    rules: {
      eqeqeq: "error", // === en vez de ==
      "no-var": "error", // let o const en vez de var
      "prefer-const": "error", // const si la variable no cambia
      "no-empty": "error", // nada de bloques vacíos, como un catch {}
    },
  },
];