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
app.post('/registrarse', validacionRegistro, async(req, res)=>{
    const usuario = req.body.usuario;
    const email = req.body.email;
    const pass = req.body.pass;
  
    console.log('Usuario:', usuario);
    console.log('Email:', email);
    console.log('Contraseña:', pass);
  
    let passwordHash = await bcryptjs.hash(pass, 8);
    connection.query('INSERT INTO usuarios (nombre, correo, password) VALUES (?,?,?)', [usuario, email, passwordHash], async(error, results)=>{
        if(error){
          console.log(error);
          res.render('sesion', {
            alert: true,
            alertTitle: "Error",
            alertMessage: "Email repetido, favor de intentar de nuevo",
            alertIcon: "warning",
            showConfirmButton: true,
            timer: 1500,
            ruta: "registrarse"
          })
        }else{
          res.render('registrarse',{
            alert: true,
            alertTitle: "Registro",
            alertMessage: "¡Registro exitoso!",
            alertIcon: "success",
            showConfirmButton: false,
            timer: 1500,
            ruta: ''
          })
        }  
    })
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
  

app.listen(3000,()=>{
    console.log('Server funciona en http://localHost:3000')
})
