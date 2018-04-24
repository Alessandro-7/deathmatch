let WIDTH = 500;
let HEIGHT = 500;
let socket = io();

//sign
let signDiv = document.getElementById('signDiv');
let signDivUsername = document.getElementById('signDiv-username');
let signDivSignIn = document.getElementById('signDiv-signIn');
let signDivSignUp = document.getElementById('signDiv-signUp');
let signDivPassword = document.getElementById('signDiv-password');

let chatText = document.getElementById('chat-text');
let chatInput = document.getElementById('chat-input');
let chatForm = document.getElementById('chat-form');
 socket.on('addToChat',function(data){
       chatText.innerHTML += '<div>' + data + '</div>';
   });
   socket.on('evalAnswer',function(data){
       console.log(data);
   });

   chatForm.onsubmit = function(e){
           e.preventDefault();
           if(chatInput.value[0] === '/')
               socket.emit('evalServer',chatInput.value.slice(1));
           else
               socket.emit('sendMsgToServer',chatInput.value);
           chatInput.value = '';
   }


signDivSignIn.onclick = function(){
   socket.emit('signIn',{username:signDivUsername.value});
}

socket.on('signInResponse',function(data){
   if(data.success){
       signDiv.style.display = 'none';
       gameDiv.style.display = 'inline-block';
   } else
       alert("Sign in unsuccessul.");
});

//game

let Img = {};
Img.player = new Image();
Img.player.src = '/client/img/player.png';
Img.bullet = new Image();
Img.bullet.src = '/client/img/bullet.png';

Img.superBullet = new Image();
Img.superBullet.src = '/client/img/superBullet.png';

Img.map = new Image();
Img.map.src = '/client/img/map.png';


let ctx = document.getElementById("ctx").getContext("2d");
ctx.font = '30px Arial';

let Player = function(initPack){
	let self = {};
	self.id = initPack.id;
	self.number = initPack.number;
	self.x = initPack.x;
	self.y = initPack.y;
  self.hp = initPack.hp;
  self.hpMax = initPack.hpMax;
  self.score = initPack.score;
  self.superBullets = initPack.superBullets;
  self.superBulletsMax = initPack.superBulletsMax;
  self.draw = function() {
  let x = self.x - Player.list[selfId].x + WIDTH/2;
	let y = self.y - Player.list[selfId].y + HEIGHT/2;
  let hpWidth = 30 * self.hp / self.hpMax;

  ctx.fillStyle = 'red';
  ctx.fillRect(x - hpWidth / 2, y - 40, hpWidth, 4);
  let width = Img.player.width;
	let height = Img.player.height;
	ctx.drawImage(Img.player,0,0,Img.player.width,Img.player.height,
                x-width/2,y-height/2,width,height);

}
	Player.list[self.id] = self;
	return self;
}
Player.list = {};


let Bullet = function(initPack){
	let self = {};
	self.id = initPack.id;
	self.x = initPack.x;
	self.y = initPack.y;
  self.isSuper = initPack.isSuper;
  self.draw = function() {
      let x = self.x - Player.list[selfId].x + WIDTH/2;
      let y = self.y - Player.list[selfId].y + HEIGHT/2;

      if (!self.isSuper) {
      let width = Img.bullet.width/2;
  		let height = Img.bullet.height/2;
  		ctx.drawImage(Img.bullet,
  			0,0,Img.bullet.width,Img.bullet.height,
  			x-width/2,y-height/2,width,height);
      }
      else {
        let width = Img.superBullet.width/2;
        let height = Img.superBullet.height/2;
        ctx.drawImage(Img.superBullet,
          0,0,Img.superBullet.width,Img.superBullet.height,
          x-width/2,y-height/2,width,height);
      }
  }
	Bullet.list[self.id] = self;
	return self;
}
Bullet.list = {};
let selfId = null;

socket.on('init',function(data){
  if(data.selfId)
  	selfId = data.selfId;

  for(let i = 0 ; i < data.player.length; i++){
  	new Player(data.player[i]);
  }
  for(let i = 0 ; i < data.bullet.length; i++){
  	new Bullet(data.bullet[i]);
  }
});

socket.on('update',function(data){

  for(let i = 0 ; i < data.player.length; i++){
  	let pack = data.player[i];
  	let p = Player.list[pack.id];
  	if(p){
  		if(pack.x !== undefined)
  			p.x = pack.x;
  		if(pack.y !== undefined)
  			p.y = pack.y;
      if(pack.hp !== undefined)
  			p.hp = pack.hp;
      if(pack.score !== undefined)
        p.score = pack.score;
      if(pack.superBullets !== undefined)
        p.superBullets = pack.superBullets;
  	}
  }
  for(let i = 0 ; i < data.bullet.length; i++){
  	let pack = data.bullet[i];
  	let b = Bullet.list[data.bullet[i].id];
  	if(b){
  		if(pack.x !== undefined)
  			b.x = pack.x;
  		if(pack.y !== undefined)
  			b.y = pack.y;
  	}
  }
});

socket.on('remove',function(data){

  for(let i = 0 ; i < data.player.length; i++){
  	delete Player.list[data.player[i]];
  }
  for(let i = 0 ; i < data.bullet.length; i++){
  	delete Bullet.list[data.bullet[i]];
  }
});

setInterval(function(){
  if(!selfId)
  	return;
  ctx.clearRect(0,0,500,500);
  drawMap();
  drawScore();
  drawSuperBulletsCount();
  for(let i in Player.list)
    Player.list[i].draw();
  for(let i in Bullet.list)
    Bullet.list[i].draw();
}, 40);


let drawMap = function(){

  let x = WIDTH/2 - Player.list[selfId].x;
  let y = HEIGHT/2 - Player.list[selfId].y;
  ctx.drawImage(Img.map, x, y, Img.map.width*1.5, Img.map.height*1.5);
}

let drawScore = function(){
  ctx.fillStyle = 'white';
  ctx.fillText(Player.list[selfId].score,0,30);
}

let drawSuperBulletsCount = function(){
  ctx.fillStyle = 'black';
  ctx.fillText(Player.list[selfId].superBullets,443,488);
  ctx.fillText('SB: ',390,488);
}


document.onkeydown = function(event){
  if (event.keyCode === 68)    //d
      socket.emit('keyPress',{inputId:'right',state:true});
  else if(event.keyCode === 83)   //s
      socket.emit('keyPress',{inputId:'down',state:true});
  else if(event.keyCode === 65) //a
      socket.emit('keyPress',{inputId:'left',state:true});
  else if(event.keyCode === 87) // w
      socket.emit('keyPress',{inputId:'up',state:true});
  else if(event.keyCode === 32) // w
      socket.emit('keyPress',{inputId:'superAttack',state:true});

}
document.onkeyup = function(event){
  if (event.keyCode === 68)    //d
      socket.emit('keyPress', {inputId:'right',state:false});
  else if(event.keyCode === 83)   //s
      socket.emit('keyPress', {inputId:'down',state:false});
  else if(event.keyCode === 65) //a
      socket.emit('keyPress', {inputId:'left',state:false});
  else if(event.keyCode === 87) // w
      socket.emit('keyPress', {inputId:'up',state:false});
  else if(event.keyCode === 32) // w
      socket.emit('keyPress', {inputId:'superAttack',state:false});
}

document.onmousedown = function(event){
 socket.emit('keyPress',{inputId:'attack',state:true});
}
document.onmouseup = function(event){
   socket.emit('keyPress',{inputId:'attack',state:false});
}
document.onmousemove = function(event){
   let x = -250 + event.clientX - 8;
   let y = -250 + event.clientY - 8;
   let angle = Math.atan2(y,x) / Math.PI * 180;
   socket.emit('keyPress',{inputId:'mouseAngle',state:angle});
}
