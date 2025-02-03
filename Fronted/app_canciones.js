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

//Para cuando se haga click en alguno de los botones que se encuentran el perfil.ejs
document.addEventListener('DOMContentLoaded', () => {
  console.log('Documento cargado');  //Verifica que este el documento cargado
  
  // Verifica si los botones existen
  const btnPerfil = document.getElementById('btnPerfil');
  const btnAjustes = document.getElementById('btnAjustes');
  const btnCerrar = document.getElementById('btnCerrar');
  const infoPerfil = document.getElementById('infoPerfil');
  const actuInfo = document.getElementById('actuInfo');

  console.log(btnPerfil, btnAjustes, btnCerrar, infoPerfil, actuInfo); //Verifica que esten
  
  //Marca en consola que no se encontraron
  if (!btnPerfil || !btnAjustes || !btnCerrar || !infoPerfil || !actuInfo) {
    console.error('Uno o más elementos no se encontraron en el DOM.');
    return;
  }

  //Funcionalidad de botones, incluyendo un mensaje para que se muestre en la 
  //consola que esten siendo usados
  btnPerfil.addEventListener('click', () => {
    console.log('Botón "Perfil" clickeado');
    infoPerfil.style.display = 'block';
    actuInfo.style.display = 'none';
  });

  btnAjustes.addEventListener('click', () => {
    console.log('Botón "Ajustes" clickeado');
    actuInfo.style.display = 'block';
    infoPerfil.style.display = 'none';
  });

  btnCerrar.addEventListener('click', () => {
    window.location.href = '/';
  });
});

// Para cuando se elimine la cuenta del usuario
document.getElementById("btnEliminar").addEventListener("click", function () {
  console.log("Botón eliminar presionado"); // Verifica si llega aquí
  if (confirm("¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.")) {
      fetch("/eliminarUsuario", {
          method: "DELETE",
          headers: {
              "Content-Type": "application/json"
          }
      })
      .then(response => response.json())
      .then(data => {
          alert(data.message); //Mensaje de éxito o error
          if (data.success) {
              window.location.href = ""; //Para dirigir a sesion
          }
      })
      .catch(error => console.error("Error al eliminar la cuenta:", error));
  }
});

// Para cuando se actualicen los datos
document.getElementById("updateForm").addEventListener("submit", async (e) => {
  e.preventDefault(); // Evita el envío por defecto del formulario

  const newName = document.getElementById("newName").value;
  const newPassword = document.getElementById("newPassword").value;
  const newEmail = document.getElementById("newEmail").value;

  const response = await fetch('/actualizarPerfil', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ newName, newPassword, newEmail }),
  });
  const data = await response.json();

  if (data.success) {
    alert(data.message); // Mensaje de éxito
    // Actualizados los datos de nombre y email
    document.getElementById("username").textContent = data.nombre;
    document.getElementById("userEmail").textContent = data.email;
    // Para redirigir a perfil con los datos actualizados
    window.location.href = 'perfil';
  } else {
    alert(data.message); //Mensaje de error
  }
});

// Verificación de sesión y redirección en /perfil
fetch('/perfil')
.then(response => response.json())
.then(data => {
  if (data.nombre && data.email) {
    document.getElementById("username").textContent = data.nombre;
    document.getElementById("userEmail").textContent = data.email;
  } else {
    // Verifica si no hay sesión activa antes de redirigir
    if (!localStorage.getItem('token')) {
      window.location.href = "/"; // Redirige solo si no hay sesión
    }
  }
})
.catch(error => {
  console.error("Error al obtener los datos:", error);
  // Verifica si no hay sesión activa antes de redirigir
  if (!localStorage.getItem('token')) {
    window.location.href = "/"; // Redirige solo si no hay sesión
  }
});