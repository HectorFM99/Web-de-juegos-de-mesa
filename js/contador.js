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
  } catch (error) {
    console.log(error);
  }
}

contar("visitante");