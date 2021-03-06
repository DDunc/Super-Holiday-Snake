/* global Phaser RemotePlayer io */

var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update, render: render });

var randomizer = function (min, max) {
 return Math.floor(Math.random()*((max-min) +1)) + min;
  };




function preload () {
  game.load.image('ball','assets/shinyball.png');
  game.load.image('earth', 'assets/ice.png');
  game.load.image('apple', 'assets/apple.png');
  game.load.image('snakehead', 'assets/snakehead.png');
  game.load.spritesheet('dude', 'assets/dude.png', 64, 64);
  game.load.spritesheet('enemy', 'assets/dude.png', 64, 64);
  game.load.audio('scream', 'assets/scream.mp3');
  game.load.image('snowman', 'assets/snowman.png');
  game.load.spritesheet('dude2', 'assets/dude2.png', 64, 64)
}

var socket; // Socket connection;

var land;

var player;
var player2;

var enemies;

var snakeOpts = {
  goToPlayer: function (){game.physics.arcade.moveToObject(snakeHead, player, 150)},
  goToObstacle: function(){game.physics.arcade.moveToObject(snakeHead, snowman, 300)},
  goRight: function(){snakeHead.body.angularVelocity = 400},
  goLeft: function(){snakeHead.body.angularVelocity = -400},
  currentOpt: function(){game.physics.arcade.moveToObject(snakeHead, player, 150)}
}


var currentSpeed = 0;
var cursors;

var snakeCountdown = 10;

//snake stuff
var snakeHead; //head of snake sprite
var snakeSection = []; //array of sprites that make the snake body sections
var snakePath = []; //arrary of positions(points) that have to be stored for the path the sections follow
var numSnakeSections = 5; //number of snake body sections
var snakeSpacer = 1; //parameter that sets the spacing between sections

var snowman;

function randomizedStart(){
    return Math.round(Math.random() * (800) - 200);
}




function playerInit() {
  player = game.add.sprite(randomizedStart(), randomizedStart(), 'dude');
  game.physics.arcade.enable(player);
  player.anchor.setTo(0.5, 0.5);
  player.animations.add('move', [0, 1, 2, 3, 4, 5, 6, 7], 20, true);
  player.animations.add('stop', [3], 20, true);
  player.body.bounce.setTo(0.8, 0.8);
  // This will force it to decelerate and limit its speed
  //player.body.drag.setTo(200, 200);
  player.body.maxVelocity.setTo(500, 500);
  player.body.collideWorldBounds = true;
  player.bringToTop();
}

function player2Init() {
  player2 = game.add.sprite(randomizedStart(), randomizedStart(), 'dude2');
  game.physics.arcade.enable(player2);
  player2.anchor.setTo(0.5, 0.5);
  player2.animations.add('move', [0, 1, 2, 3, 4, 5, 6, 7], 20, true);
  player2.animations.add('stop', [3], 20, true);
  player2.body.bounce.setTo(0.8, 0.8);
  // This will force it to decelerate and limit its speed
  //player.body.drag.setTo(200, 200);
  player2.body.maxVelocity.setTo(500, 500);
  player2.body.collideWorldBounds = true;
}

function snakeInit() {
  snakeHead = game.add.sprite(400, 300, 'ball');
  snakeHead.anchor.setTo(0.5, 0.5);
  game.physics.arcade.enable(snakeHead);
  for (var i = 1; i <= numSnakeSections-1; i++) {
    snakeSection[i] = game.add.sprite(400, 300, 'ball');
    snakeSection[i].anchor.setTo(0.5, 0.5);
  }

  for (var k = 0; k <= numSnakeSections * snakeSpacer; k++) {
    snakePath[k] = new Phaser.Point(400, 300);
  }

  snakeHead.body.collideWorldBounds = true;
}

function obstacleInit(){
snowman = game.add.sprite(randomizedStart(), randomizedStart(), 'snowman');
game.physics.arcade.enable(snowman);
snowman.body.velocity.setTo(300, 300);
snowman.body.collideWorldBounds = true;
snowman.body.bounce.setTo(1, 1);
}

function create () {
   game.physics.startSystem(Phaser.Physics.ARCADE);

  socket = io.connect();
  // Resize our game world to be a 2000 x 2000 square
  game.world.setBounds(-500, -500, 1000, 1000);

  // Our tiled scrolling background
  land = game.add.tileSprite(0, 0, 800, 600, 'earth');
  land.fixedToCamera = true;
  scream = game.add.audio('scream');
  playerInit();
  //  Init snakeSection array
  snakeInit();
  obstacleInit();
  //player2Init();
  // The base of our player
  //var startX = Math.round(Math.random() * (1000) - 500);
  //var startY = Math.round(Math.random() * (1000) - 500);
  //player = game.add.sprite(startX, startY, 'dude');
 // apple = game.add.sprite(randomizedStart(), randomizedStart(), 'apple');
 //snowMan1 = game.add.sprite(randomizedStart(), randomizedStart(), 'snakehead');
  //game.physics.arcade.enable(player);
  //game.physics.arcade.enable(snake);
  //game.physics.arcade.enable(snakeHead);

  // This will force it to decelerate and limit its speed
  //player.body.drag.setTo(200, 200);
  //snake.body.collideWorldBounds = true;
  //snakeHead.body.collideWorldBounds = true;
  // Create some baddies to waste :)
  enemies = [];
  game.camera.follow(player);
  game.camera.deadzone = new Phaser.Rectangle(150, 150, 500, 300);
  game.camera.focusOnXY(0, 0);
  //cursors = game.input.keyboard.createCursorKeys()
  //key direction implementation
  keys = game.input.keyboard.createCursorKeys();

  /*if(this.keys.left.isDown) {
      this.ball.body.velocity.x -= this.movementForce;
  }
  else if(this.keys.right.isDown) {
      this.ball.body.velocity.x += this.movementForce;
  }
  if(this.keys.up.isDown) {
      this.ball.body.velocity.y -= this.movementForce;
  }
  else if(this.keys.down.isDown) {
      this.ball.body.velocity.y += this.movementForce;
  } */
  // Start listening for events

  setEventHandlers();
}

var setEventHandlers = function () {
  // Socket connection successful
  socket.on('connect', onSocketConnected);

  // Socket disconnection
  socket.on('disconnect', onSocketDisconnect);

  // New player message received
  socket.on('new player', onNewPlayer);

  // Player move message received
  socket.on('move player', onMovePlayer);

  socket.on('move snake', onMoveSnake)
  // Player removed message received
  socket.on('remove player', onRemovePlayer);
};

// Socket connected
function onSocketConnected () {
  console.log('Connected to socket server');

  // Send local player data to the game server
  socket.emit('new player', { x: player.x, y: player.y });
}

// Socket disconnected
function onSocketDisconnect () {
  console.log('Disconnected from socket server');
}

// New player
function onNewPlayer (data) {
  console.log('New player connected:', data.id);

  // Add new player to the remote players array
  enemies.push(new RemotePlayer(data.id, game, player, data.x, data.y));
}

// Move player
function onMovePlayer (data) {
  var movePlayer = playerById(data.id);

  // Player not found
  if (!movePlayer) {
    console.log('Player not found: ', data.id);
    return;
  }

  // Update player position
  movePlayer.player.x = data.x;
  movePlayer.player.y = data.y;
}

function onMoveSnake (data) {
  console.log(data)
  // Update player position
  snake.x = data.x;
  snake.y = data.y;
}


// Remove player
function onRemovePlayer (data) {
  var removePlayer = playerById(data.id);

  // Player not found
  if (!removePlayer) {
    console.log('Player not found: ', data.id);
    return;
  }

  removePlayer.player.kill();

  // Remove player from array
  enemies.splice(enemies.indexOf(removePlayer), 1);
}

function update () {
  game.physics.arcade.collide(player, snowman);
  game.physics.arcade.collide(snakeHead, snowman);
  //snake.body.x += .1;
  for (var i = 0; i < enemies.length; i++) {
    if (enemies[i].alive) {
      enemies[i].update();
      game.physics.arcade.collide(player, enemies[i].player);
    }
  }
   if (keys.left.isDown) {
    player.angle -= 5;
    if (currentSpeed > 0){
      currentSpeed = currentSpeed - 1 ;
    }
  }

  /* else if (keys.right.isDown) {
    player.angle += 4
  } */

  /* if (keys.up.isDown) {
    player.angle += 10
  } else if (keys.down.isDown) {
    player.angle -= 10
  } */

  else if (keys.up.isDown)  {
    currentSpeed = currentSpeed + 5;
    player.body.velocity.setTo(player.body.velocity + 100);
  } else {
    if (currentSpeed > 0) {
      currentSpeed -=  2;
      player.body.velocity.setTo(player.body.velocity.x -1, player.body.velocity.y - 1);
    }
  }
 //game.physics.arcade.velocityFromRotation(player.rotation, currentSpeed, player.body.velocity)
  if (currentSpeed > 0) {
    game.physics.arcade.velocityFromRotation(player.rotation, currentSpeed, player.body.velocity);

    player.animations.play('move');
  } else {
    player.animations.play('stop');
  }

  land.tilePosition.x = -game.camera.x;
  land.tilePosition.y = -game.camera.y;

  /* if (game.input.activePointer.isDown) {
    if (game.physics.distanceToPointer(player) >= 10) {
      currentSpeed = 300

      player.rotation = game.physics.angleToPointer(player)
    }
  } */

  socket.emit('move player', { x: player.x, y: player.y });
  snakeHead.body.velocity.setTo(0, 0);
    snakeHead.body.angularVelocity = 0;
    //if (keys.up.isDown)

    //{
        snakeHead.body.velocity.copyFrom(game.physics.arcade.velocityFromAngle(snakeHead.angle, 300));

        // Everytime the snake head moves, insert the new location at the start of the array,
        // and knock the last position off the end
       game.physics.arcade.overlap(snakeHead, player, collisionHandler, null, this);
       game.physics.arcade.overlap(snakeHead, player2, collisionHandler, null, this);
        var part = snakePath.pop();
        part.setTo(snakeHead.x, snakeHead.y);
        snakePath.unshift(part);

         for (var j = 1; j < numSnakeSections; j++) {
          //console.log((snakePath[j * snakeSpacer]).x);
          //console.log(snakePath);
            snakeSection[j].x = (snakePath[j * snakeSpacer]).x;
            snakeSection[j].y = (snakePath[j * snakeSpacer]).y;
        }
    //}
     game.physics.arcade.overlap(snakeHead, player, collisionHandler, null, this);
     snakeHeading()

    //if (keys.left.isDown)
   //{
        //snakeHead.body.angularVelocity = Math.random() * (-100);
    //}
    //else if (keys.right.isDown)
    //{
        //snakeHead.body.angularVelocity = 300;
    //}
    //what passes for AI
}

//will need to put socket.emit('move player', { x: player.x, y: player.y })
function render () {
 game.debug.spriteInfo(player, 32, 32);
}

// Find player by ID
function playerById (id) {
  for (var i = 0; i < enemies.length; i++) {
    if (enemies[i].player.name === id) {
      return enemies[i];
    }
  }

  return false;
}

/* function playerCollider (player, enemy) {
     if (player.body.touching.up === true) {
      player.body.y -= 20;
   }
        if (player.body.touching.down === true) {
      player.body.y += 20;
   }
    if (player.body.touching.right === true) {
      player.body.x -= 20;
   }
    if (player.body.touching.left === true) {
      player.body.x += 20;
   }
} */

function collisionHandler (snake, deadplayer) {
  console.log("player killed!");
  scream.play();
  deadplayer.kill();
  numSnakeSections++;
  console.log(snakeSection);
  console.log(snakePath.length);
  //debugger;
  snakePath.push(new Phaser.Point(400, 300));
  console.log(snakePath.length);
  snakeSection.push(game.add.sprite(400, 300, 'ball'));
  snakeSection[(numSnakeSections - 1)].anchor.setTo(0.5, 0.5);
  playerInit();
}

    function snakeHeading(){
      snakeCountdown--;
      if(snakeCountdown === 0){
        snakeCountdown = 20;
        console.log(snakeOpts)
        snakeOpts.currentOpt = snakeOpts[Object.keys(snakeOpts)[randomizer(0, Object.keys(snakeOpts).length-1)]];
      }
      console.log(snakeOpts.currentOpt)
       socket.emit('move snake', { x: snakeHead.x, y: snakeHead.y });
       console.log("snakehead x and y", snakeHead.x, snakeHead.y);
      snakeOpts.currentOpt()
      //debugger;
    }
    //  Increase the score
    //score += 20;
    //scoreText.text = scoreString + score;
    //  And create an explosion :)
    //var explosion = explosions.getFirstExists(false);
    //explosion.reset(player.body.x, player.body.y);
    //explosion.play('kaboom', 30, false, true);
    /*if (players.countLiving() == 0)
    {
        score += 1000;
        scoreText.text = scoreString + score;

        enemyBullets.callAll('kill',this);
        stateText.text = " You Won, \n Click to restart";
        stateText.visible = true;

        //the "click to restart" handler
        game.input.onTap.addOnce(restart,this);
    } */

