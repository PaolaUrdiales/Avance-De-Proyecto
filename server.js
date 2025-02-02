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
  



app.listen(3000,()=>{
    console.log('Server funciona en http://localHost:3000')
})
