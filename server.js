//Variables de entorno
require('dotenv').config();

//Librerias
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcryptjs = require('bcryptjs');
const path = require('path');
const expressSession = require('express-session');
const methodOverride = require('method-override'); // Para manejar el método PATCH

const app = express(); //Iniciar app

//Middleware
app.use(express.json());
app.use(cors());
app.use(methodOverride('_method')); //Method-override para sobrescribir el método HTTP
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'fronted')));
app.use('/js', express.static(path.join(__dirname, 'fronted', 'js')));

//Motor de plantillas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//Conexión a MySQL con variables de entorno
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

module.exports = connection;

//Prueba de la conexión a la base de datos
connection.connect((err) => {
    if (err) {
      console.error('Error al conectar a la base de datos:', err);
      return;
    }
    console.log('Conexión exitosa a la base de datos.');
});

//Configuración de la sesión
app.use(expressSession({
    secret: 'claveSecreta', 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));

app.use(cors({
    origin: '*',
    methods: ['GET','POST','PATCH','DELETE'],
    allowedHeaders: ['Content-Type','Authorization']
}));

//HTML "sesion" como principal
app.get('/', (req, res)=>{
    res.sendFile(path.join(__dirname, 'fronted', 'sesion.html'))
})

//HTML "Pagina principal"
app.get('/pagPrincipal', (req, res) => {
    if (req.session.loggedin) {
      res.sendFile(path.join(__dirname, 'fronted', 'pagPrincipal.html'));
    } else {
      res.redirect('/');
    }
});
  
//HTML "Lista de canciones"
app.get('/listaCanciones', (req, res) => {
    res.sendFile(path.join(__dirname, 'fronted', 'listaCanciones.html'));
});
  
//HTML "Registrarse"
app.get('/registrarse', (req, res) => {
    res.sendFile(path.join(__dirname, 'fronted', 'registrarse.html'));
});
  
//CRUD
//Crear nuevo usuario,  CREATED
app.post('/registrarse', async(req, res)=>{
    const usuario = req.body.usuario;
    const email = req.body.email;
    const pass = req.body.pass;
  
    console.log('Usuario:', usuario);
    console.log('Email:', email);
    console.log('Contraseña:', pass);
  
    try{
      let passwordHash = await bcryptjs.hash(pass, 8);
      connection.query('INSERT INTO usuarios (nombre, correo, password) VALUES (?,?,?)', [usuario, email, passwordHash],(error, results) => {
              if (error) {
                  console.log(error);
                  let alertMessage = "Ocurrió un error, favor de intentar de nuevo";
                  //Verifica que el error es por entrada de datos duplicados
                  if (error.code === 'ER_DUP_ENTRY') {
                      //Revisamos en el mensaje del error qué campo está duplicado
                      if (error.sqlMessage.includes("nombre")) {
                          alertMessage = "El nombre de usuario ya existe, intenta con otro.";
                      } else if (error.sqlMessage.includes("correo")) {
                          alertMessage = "El correo ya está registrado, favor de intentar con otro.";
                      }
                  }
                  return res.render('sesion', {
                      alert: true,
                      alertTitle: "Error",
                      alertMessage: alertMessage,
                      alertIcon: "warning",
                      showConfirmButton: true,
                      timer: 1500,
                      ruta: "registrarse"
                  });
              } else {
                  return res.render('registrarse', {
                      alert: true,
                      alertTitle: "Registro",
                      alertMessage: "¡Registro exitoso!",
                      alertIcon: "success",
                      showConfirmButton: false,
                      timer: 1500,
                      ruta: ''
                  });
              }
          }
      );
  }catch(err){
      console.error("Error al encriptar la contraseña:", err);
      return res.render('sesion', {
          alert: true,
          alertTitle: "Error",
          alertMessage: "Ocurrió un error en el servidor, por favor intente de nuevo.",
          alertIcon: "error",
          showConfirmButton: true,
          timer: 1500,
          ruta: "registrarse"
      });
  }
});
  
//Inicio de sesión de usuario, donde recibimos información del usuario 
app.post('/sesion', async (req, res) => {
    const usuario = req.body.usuario;
    const pass = req.body.pass;
  
    if (usuario && pass) {
      connection.query('SELECT * FROM usuarios WHERE nombre = ?', [usuario], async (error, results) => {
        if (error) {
          console.log(error);
          return res.render('sesion', {
            alert: true,
            alertTitle: "Error",
            alertMessage: "Error en la base de datos. Intenta nuevamente.",
            alertIcon: "error",
            showConfirmButton: true,
            timer: null,
            ruta: ''
          });
        }
  
        if (results.length == 0 || !(await bcryptjs.compare(pass, results[0].password))) {
          return res.render('sesion', {
            alert: true,
            alertTitle: "Error de autenticación",
            alertMessage: "Usuario y/o contraseña incorrectos.",
            alertIcon: "error",
            showConfirmButton: true,
            timer: null,
            ruta: ''
          });
        } else {
          //Datos del usuario
          req.session.loggedin = true;
          req.session.userId = results[0].id;
          req.session.nombre = results[0].nombre;
          req.session.email = results[0].correo;
  
          //Mensaje de que se logro la sesión
          return res.render('sesion', {
            alert: true,
            alertTitle: "Inicio de sesión exitoso",
            alertMessage: "¡Bienvenido de nuevo!",
            alertIcon: "success",
            showConfirmButton: false,
            timer: 1500,
            ruta: 'perfil' //Manda a perfil
          });
        }
      });
    } else {
      return res.render('sesion', {
        alert: true,
        alertTitle: "Campos vacíos",
        alertMessage: "Por favor ingrese usuario y contraseña.",
        alertIcon: "warning",
        showConfirmButton: true,
        timer: null,
        ruta: ''
      });
    }
});

//Lee la informacion del usuario de la base de datos para poder mostrar basado 
//en donde recibimos la información, READ
app.get('/perfil', (req, res) => {
    const userId = req.session.userId;
    //Verificar si el usuario en la sesión
    if (!userId) {
      return res.redirect('/');
    }
    //Consultamos la base de datos si esta en sesión
    connection.query('SELECT nombre, correo FROM usuarios WHERE id = ?', [userId], (error, results) => {
      if (error || results.length === 0) {
        //En caso que ya haya sido eliminado.
        req.session.destroy((err) => {
          if (err) {
            console.log('Error al cerrar sesión después de eliminar la cuenta:', err);
          }
          return res.redirect('/');
        });
      } else {
        //Si hay usuario se debe mostrar el perfil
        const user = results[0];
        res.render('perfil', {
          nombre: user.nombre,
          email: user.correo
        });
      }
    });
});
  
app.get('/perfil', (req, res) => {
    if (req.session.loggedin) {
      res.render('perfil', { 
        nombre: req.session.nombre, 
        email: req.session.correo 
      });
  
    } else {
      res.redirect('');
    }
});
  
//Actualización del perfil del usuario, UPDATE
app.patch('/actualizarPerfil', async (req, res) => {
    const { newName, newPassword, newEmail } = req.body;
    const userId = req.session.userId; //ID del usuario desde la sesión
  
    //Verificar si se dio un nombre
    if (!newName) {
      return res.render('perfil', {
        nombre: req.session.nombre || '',
        email: req.session.email || '',
        success: false,
        alert: true,
        alertTitle: "El nuevo nombre es obligatorio.",
        alertIcon: "error",
        showConfirmButton: false,
        timer: 1000,
        ruta: 'perfil'
      });
    }
    let updateValues = [newName];
  
    //Verificar si se dio un nuevo correo y tiene @ junto al .
    if (newEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        return res.render('perfil', {
          nombre: req.session.nombre || '',
          email: req.session.email || '',
          success: false,
          alert: true,
          alertTitle: "Correo electrónico inválido.",
          alertIcon: "error",
          showConfirmButton: false,
          timer: 1000,
          ruta: 'perfil'
        });
      }
      updateValues.push(newEmail);
    }
  
    //Verificar y encriptar la contraseña nueva si se ingresa una
    let passwordHash = null;
    if (newPassword) {
      passwordHash = await bcryptjs.hash(newPassword, 8);
      updateValues.push(passwordHash);
    }
    //Actualizar los datos en la base de datos
    let updateQuery = 'UPDATE usuarios SET nombre = ?';
    if (newEmail) {
      updateQuery += ', correo = ?';
    }
    if (passwordHash) {
      updateQuery += ', password = ?';
    }
    updateQuery += ' WHERE id = ?';
    updateValues.push(userId);
  
    //Comprobar la actualización
    connection.query(updateQuery, updateValues, (error, results) => {
      if (error) {
        console.log("Error en la actualización:", error);
        return res.render('perfil', {
          nombre: req.session.nombre || '',
          email: req.session.email || '',
          success: false,
          alert: true,
          alertTitle: "Error al actualizar los datos.",
          alertIcon: "error",
          showConfirmButton: false,
          timer: 1000,
          ruta: 'perfil'
        });
      }
      //Datos nuevos del usuario
      connection.query('SELECT nombre, correo FROM usuarios WHERE id = ?', [userId], (error, results) => {
        if (error) {
          console.log("Error al obtener los datos actualizados:", error);
          return res.render('perfil', {
            nombre: req.session.nombre || '',
            email: req.session.email || '',
            success: false,
            alert: true,
            alertTitle: "Error al obtener los datos actualizados.",
            alertIcon: "error",
            showConfirmButton: false,
            timer: 1000,
            ruta: 'perfil'
          });
        }
        const updatedUser = results[0];
        console.log('Datos actualizados:', updatedUser);
  
        //Los datos con los nuevos valores
        req.session.nombre = updatedUser.nombre;
        req.session.email = updatedUser.correo;
        //Mensaje donde se confirma la actualización
        return res.render('perfil', {
          nombre: updatedUser.nombre,
          email: updatedUser.correo,
          alert: true,
          alertTitle: "Actualización exitosa",
          alertIcon: "success",
          showConfirmButton: false,
          timer: 1500,
          ruta: 'perfil'
        });
      });
    });
});

//Eliminar los datos del usuario en la base de datos, DELETE
app.delete('/eliminarUsuario', (req, res) => {
    console.log("Solicitud DELETE recibida para eliminar usuario con ID:", req.session.userId);
    const userId = req.session.userId;
  
    if (!userId) {
      console.log("No hay usuario.");
      return res.render('perfil', {
        success: false,
        alert: true,
        alertTitle: "No hay usuario.",
        alertIcon: "error",
        showConfirmButton: false,
        timer: 1000,
        ruta: ''
      });
    }
  
    connection.query('DELETE FROM usuarios WHERE id = ?', [userId], (error, results) => {
      if (error) {
        console.log('Error al eliminar la cuenta:', error);
        return res.render('sesion', {
          success: false,
          alert: true,
          alertTitle: "Error al eliminar la cuenta.",
          alertMessage: "Hubo problemas a la hora de eliminar la cuenta.",
          alertIcon: "error",
          showConfirmButton: false,
          timer: 1000,
          ruta: 'perfil'
        });
      }
  
      req.session.destroy((err) => {
        if (err) {
          console.log('Error al cerrar sesión después de eliminar la cuenta:', err);
          return res.render('sesion', {
            success: false,
            alert: true,
            alertTitle: "Error al cerrar sesión.",
            alertMessage: "Inconvenientes en cerrar sesión.",
            alertIcon: "error",
            showConfirmButton: false,
            timer: 1000,
            ruta: 'perfil'
          });
        }
  
        return res.render('sesion', {
          success: true,
          alert: true,
          alertTitle: "Eliminación exitosa",
          alertMessage: "¡Eliminación exitosa, gracias por ser parte de Rhymes Music!",
          alertIcon: "success",
          showConfirmButton: false,
          timer: 2000,
          ruta: '/'
        });
      });
    });
});
  
//Cerrar sesion de usuario
app.post('/perfil', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.json({ success: false, message: 'Error al cerrar sesión.' });
      }
      res.json({ success: true });
    });
});
  

app.listen(3000,()=>{
    console.log('Server funciona en http://localHost:3000')
})
