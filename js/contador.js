/* global module */
let visitas = 0;

function contar(nombre) {
  visitas = visitas + 1;
  const saludo = document.getElementById("saludo");

  if (visitas === 1) {
    saludo.innerHTML = "Hola " + nombre + ", es tu primera visita";
  } else {
    if (visitas ===  2) {
      saludo.innerHTML = "Hola " + nombre + ", es tu segunda visita";
    } else {
      saludo.innerHTML = "Hola " + nombre + ", ya llevas " + visitas + " visitas";
    }
  }

  try {
    localStorage.setItem("visitas", visitas);
  } catch {
    // Ignore localStorage write error in private browsing mode or when storage is disabled
  }
}

contar("visitante");

// Exportable para tests (Node) sin afectar la carga como <script> en el navegador.
if (typeof module !== "undefined" && module.exports) {
  module.exports = { contar };
}
