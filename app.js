var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var http = require('http');
var WebSocket = require('ws');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// Configuración del motor de vistas
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Crear servidor HTTP a partir de la aplicación de Express
var server = http.createServer(app);

// Middleware para capturar intentos de conexión WebSocket antes de que lleguen a otros manejadores
app.use(function(req, res, next) {
    if (req.headers['upgrade'] && req.headers['upgrade'].toLowerCase() === 'websocket') {
        // No hacer nada aquí, dejar que ws maneje esto más adelante
    } else {
        next();
    }
});

// Configurar el servidor WebSocket con el servidor HTTP
const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws) {
    console.log('A new WebSocket client connected.');
    ws.on('message', function incoming(message) {
        console.log('Received message: %s from client', message);
        wss.clients.forEach(function each(client) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });
    ws.on('close', () => {
        console.log('WebSocket client has disconnected.');
    });
});

// Rutas de Express
app.use('/', indexRouter);
app.use('/users', usersRouter);

// Manejador de errores de Express
app.use(function(err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.render('error');
});

// Escuchar en un puerto
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
