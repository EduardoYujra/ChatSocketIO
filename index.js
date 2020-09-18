// Setup basic express server
var express = require('express');
var path = require('path');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));

var numUsers = 0;

io.on('connection', (socket) => {
  var addedUser = false;

  // Escucho el evento "new message" y procedo a compartir el event "new messsage" a los demas clientes
  socket.on('new message', (data) => {
    
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // Escucho el evento "add user" y procedo a agregar la informacion 
  socket.on('add user', (username) => {
    if (addedUser) return;

    socket.username = username;//guardamos la informacion en la sesion del socket del cliente
    ++numUsers;
    addedUser = true;
    socket.emit('login', {//emitimos el nuevo numero de usuarios activos
      numUsers: numUsers
    });
    //ademas mostramos quien se unio a la sala de chat
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // emitir la accion de "typing" a los demas usuarios
  socket.on('typing', () => {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // lo mismo que antes pero cuando el se deja de escribir
  socket.on('stop typing', () => {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // Escuchamos el evento de desconexion 
  socket.on('disconnect', () => {
    if (addedUser) {
      --numUsers;

      // Informamos que el usuario dejo la sala de chat
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});
