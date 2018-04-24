var io = require('socket.io-client');
var socket = io.connect("http://localhost:2000/", {
    reconnection: true
});

socket.on('connect', function () {
    console.log('Connected to localhost:2000');
    setInterval(function() {
      socket.emit('chatBotMessage', "Some related news or something more interested and complex.");
    }, 1000);
});
