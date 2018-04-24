let express = require('express');
let app = express();
let serv = require('http').Server(app);

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(2000);
console.log('Server started');

let SOCKET_LIST = {};

let Entity = function(){
let self = {
    x: 300,
    y: 300,
    spdX: 0,
    spdY: 0,
    id: "",
}
self.update = function(){
    self.updatePosition();
}
self.updatePosition = function(){
    self.x += self.spdX;
    self.y += self.spdY;
}
self.getDistance = function(pt){
    return Math.sqrt(Math.pow(self.x-pt.x,2) + Math.pow(self.y-pt.y,2));
}
return self;
}

let Player = function(id, username) {
let self = Entity();
self.id = id;
self.username = username;
self.number = "" + Math.floor(10 * Math.random());
self.pressingRight = false;
self.pressingLeft = false;
self.pressingUp = false;
self.pressingDown = false;
self.pressingAttack = false;
self.mouseAngle = 0;
self.maxSpd = 10;
self.hp = 10;
self.hpMax = 10;
self.score = 0;

let super_update = self.update;
self.update = function() {
self.updateSpd();
super_update();

if(self.pressingAttack){
    self.shootBullet(self.mouseAngle);
}
}
self.shootBullet = function(angle) {
  let b = Bullet(self.id, angle);
  b.x = self.x;
  b.y = self.y;
}


self.updateSpd = function(){

     if (self.pressingRight && self.x <= 1200)
         self.spdX = self.maxSpd;
     else
     if (self.pressingLeft && self.x >= 255)
         self.spdX = -self.maxSpd;
     else
         self.spdX = 0;



   if (self.pressingUp && self.y >= 255)
       self.spdY = -self.maxSpd;
   else
   if (self.pressingDown && self.y <= 1200)
       self.spdY = self.maxSpd;
   else
       self.spdY = 0;

}
self.getInitPack = function() {
 return {
   id: self.id,
   x: self.x,
   y: self.y,
   number: self.number,
   hp: self.hp,
   hpMax: self.hpMax,
   score: self.score
 }
}
self.getUpdatePack = function() {
 return {
   id: self.id,
   x: self.x,
   y: self.y,
   hp: self.hp,
   score: self.score
 }
}
Player.list[id] = self;
initPack.player.push(self.getInitPack());
return self;
}
Player.list = {};
Player.onConnect = function(socket, username) {
let player = Player(socket.id, username);
socket.on('keyPress', function(data){
  if(data.inputId === 'left')
        player.pressingLeft = data.state;
    else if(data.inputId === 'right')
        player.pressingRight = data.state;
    else if(data.inputId === 'up')
        player.pressingUp = data.state;
    else if(data.inputId === 'down')
        player.pressingDown = data.state;
    else if(data.inputId === 'attack')
        player.pressingAttack = data.state;
    else if(data.inputId === 'mouseAngle')
        player.mouseAngle = data.state;
  });



  socket.emit('init', {
    selfId: socket.id,
    player: Player.getAllInitPack(),
    bullet: Bullet.getAllInitPack()
  });

  socket.on('sendMsgToServer', function(data){
        for (let i in SOCKET_LIST) {
          SOCKET_LIST[i].emit('addToChat', player.username + ": " + data);
        }

    });

}
Player.getAllInitPack = function(){
let players = [];
for (let i in Player.list)
players.push(Player.list[i].getInitPack())
return players;
}

Player.onDisconnect = function(socket) {
removePack.player.push(socket.id);
delete Player.list[socket.id];
}
Player.update = function() {
let pack = [];
for(let i in Player.list) {
let player = Player.list[i];
player.update();
pack.push(player.getUpdatePack());
}
return pack;
}


let Bullet = function(parent, angle){
let self = Entity();
self.id = Math.random();
self.spdX = Math.cos(angle/180*Math.PI) * 10;
self.spdY = Math.sin(angle/180*Math.PI) * 10;
self.parent = parent;
self.timer = 0;
self.toRemove = false;
let super_update = self.update;
self.update = function(){
    if(self.timer++ > 100)
        self.toRemove = true;
    super_update();

    for(let i in Player.list){
      let p = Player.list[i];
      if(self.getDistance(p) < 32 && self.parent != p.id) {
        p.hp--;
        if (p.hp <= 0) {
          let shooter = Player.list[self.parent];
          if (shooter)
            shooter.score++;
          p.hp = p.hpMax;
          p.x = Math.random() * 500;
          p.y = Math.random() * 500;
        }
        self.toRemove = true;
      }

    }
}

self.getInitPack = function() {
  return {
    id: self.id,
    x: self.x,
    y: self.y,
  }
}
self.getUpdatePack = function() {
  return {
    id: self.id,
    x: self.x,
    y: self.y,
  }
}
Bullet.list[self.id] = self;
initPack.bullet.push(self.getInitPack());
return self;
}
Bullet.list = {};

Bullet.update = function(){

let pack = [];
for(let i in Bullet.list){
    let bullet = Bullet.list[i];
    bullet.update();
    if (bullet.toRemove) {
      removePack.bullet.push(bullet.id);
      delete Bullet.list[i];
    }
    else
    pack.push(bullet.getUpdatePack());
}
return pack;
};

Bullet.getAllInitPack = function(){
let bullets = [];
for (let i in Bullet.list)
bullets.push(Bullet.list[i].getInitPack())
return bullets;
};

let io = require('socket.io')(serv,{});

io.sockets.on('connection', function(socket) {
socket.id = Math.random();
SOCKET_LIST[socket.id] = socket;

socket.on('signIn',function(data) {
Player.onConnect(socket, data.username);
console.log('Socket connected');
socket.emit('signInResponse',{success:true});

});


socket.on('disconnect', function(){
    delete SOCKET_LIST[socket.id];
    Player.onDisconnect(socket);
});



socket.on('evalServer',function(data){
 let res = eval(data);
 socket.emit('evalAnswer',res);
});


});

let initPack = {player: [], bullet: []};
let removePack = {player: [], bullet: []};

setInterval(function() {
let pack = {
player: Player.update(),
bullet: Bullet.update()
}

for(let i in SOCKET_LIST){
  let socket = SOCKET_LIST[i];
  socket.emit('init', initPack);
  socket.emit('update', pack);
  socket.emit('remove', removePack);
}
initPack.player = [];
initPack.bullet = [];
removePack.player = [];
removePack.bullet = [];

}, 1000/25);
