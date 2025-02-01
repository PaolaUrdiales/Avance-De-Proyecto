// Elementos del DOM a editar
const campotxt = document.getElementById("campotxt");
const plus = document.getElementById("plus");
const listaReproduccion = document.getElementById("listaReproduccion");

// Evento para agregar canciones al hacer clic en el botón "Agregar"
plus.addEventListener("click", () => {
  if (campotxt.value) {
    agregarCancionLista(campotxt.value);
    campotxt.value = "";
  } else {
    alert("El campo de texto para ingresar la canción está vacío."); 
  }
});

// Clase de CANCIONES
class Cancion {
  constructor(nombreYArtista) {
    const [nombre, artista] = nombreYArtista.split(' - ').map(part => part.trim());
    this.nombre = nombre || "Nombre desconocido";
    this.artista = artista || "Artista desconocido"; 
  }

  // Retorna información de la canción en formato "Nombre - Artista" 
  info() {
    return `${this.nombre} - ${this.artista}`;
  }
}

class GestorDeCanciones {
  constructor() {
    this.canciones = this.cargarDesdeLocalStorage(); 
  }

  agregarCancion(nombreYArtista) {
    const cancion = new Cancion(nombreYArtista);
    this.canciones.push(cancion);
    this.guardarEnLocalStorage(); 
    this.render();
  }

  guardarEnLocalStorage() {
    localStorage.setItem("canciones", JSON.stringify(this.canciones)); 
  }

  cargarDesdeLocalStorage() {
    const cancionesGuardadas = localStorage.getItem("canciones");
    if (cancionesGuardadas) {
      // Convertir el arreglo de canciones en instancias de la clase Cancion
      return JSON.parse(cancionesGuardadas).map(
        cancion => new Cancion(`${cancion.nombre} - ${cancion.artista}`)
      );
    }
    return []; 
  }

  // Renderizar la lista de canciones en el DOM
  render() {
    listaReproduccion.innerHTML = "";
    this.canciones.forEach((cancion, index) => {
      listaReproduccion.innerHTML += `
        <article>
          <b>${cancion.info()}</b> 
          <i class="editBtn marginBtn fa-solid fa-pencil" data-index="${index}"></i> 
          <i class="deleteBtn marginBtn fa-solid fa-trash" data-index="${index}"></i>
        </article>`;
    });

    // Asociar eventos a los botones de editar y eliminar después de renderizar
    document.querySelectorAll(".editBtn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        editarCancion(e.target.dataset.index);
      });
    });

    document.querySelectorAll(".deleteBtn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        eliminarCancion(e.target.dataset.index); 
      });
    });
  }
}

// Instancia del gestor de canciones
const gestor = new GestorDeCanciones();
gestor.render(); 

// FUNCIONES DE LOS BOTONES

// Función para agregar una canción
function agregarCancionLista(cancion) {
  gestor.agregarCancion(cancion);
}

// Función para eliminar una canción
function eliminarCancion(index) {
  gestor.canciones.splice(index, 1); 
  gestor.guardarEnLocalStorage(); 
  gestor.render(); 
}

// Función para editar una canción
function editarCancion(index) {
  const nuevoNombre = prompt(
    "Edita la canción (Formato: Nombre - Artista):",
    gestor.canciones[index].info()
  );
  if (nuevoNombre) {
    gestor.canciones[index] = new Cancion(nuevoNombre);
    gestor.guardarEnLocalStorage(); 
    gestor.render();
  }
}
