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
app.use(express.static(path.join(__dirname, 'fronted')));
app.use('/js', express.static(path.join(__dirname, 'fronted', 'js')));

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

//HTML "sesion" como principal
app.get('/', (req, res)=>{
    res.sendFile(path.join(__dirname, 'fronted', 'sesion.html'))
})

//Leer HTML "Pagina principal"
app.get('/pagPrincipal', (req, res) => {
    if (req.session.loggedin) {
      res.sendFile(path.join(__dirname, 'fronted', 'pagPrincipal.html'));
    } else {
      res.redirect('/');
    }
});
  
//Leer HTML "Lista de canciones"
app.get('/listaCanciones', (req, res) => {
    res.sendFile(path.join(__dirname, 'fronted', 'listaCanciones.html'));
});
  
//Leer HTML "Registrarse"
app.get('/registrarse', (req, res) => {
    res.sendFile(path.join(__dirname, 'fronted', 'registrarse.html'));
});
  

app.listen(3000,()=>{
    console.log('Server funciona en http://localHost:3000')
})
