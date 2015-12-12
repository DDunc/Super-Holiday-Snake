/* global Phaser RemotePlayer io */

var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update, render: render })

function preload () {
  game.load.image('ball','assets/shinyball.png');
  game.load.image('earth', 'assets/light_sand.png');
  game.load.image('apple', 'assets/apple.png');
  game.load.image('snakehead', 'assets/snakehead.png');
  game.load.spritesheet('dude', 'assets/dude.png', 64, 64);
  game.load.spritesheet('enemy', 'assets/dude.png', 64, 64);
}

var socket // Socket connection;

var land;

var player;

var enemies;

var currentSpeed = 0;
var cursors;

//snake stuff
var snakeHead; //head of snake sprite
var snakeSection = new Array(); //array of sprites that make the snake body sections
var snakePath = new Array(); //arrary of positions(points) that have to be stored for the path the sections follow
var numSnakeSections = 30; //number of snake body sections
var snakeSpacer = 6; //parameter that sets the spacing between sections


function randomizedStart(){
    return Math.round(Math.random() * (1000) - 500);
}

function create () {
   game.physics.startSystem(Phaser.Physics.ARCADE);
 
  socket = io.connect();

  // Resize our game world to be a 2000 x 2000 square
  game.world.setBounds(-500, -500, 1000, 1000);

  // Our tiled scrolling background
  land = game.add.tileSprite(0, 0, 800, 600, 'earth');
  land.fixedToCamera = true;


  snakeHead = game.add.sprite(400, 300, 'ball');
  snakeHead.anchor.setTo(0.5, 0.5);
  game.physics.enable(snakeHead, Phaser.Physics.ARCADE);
  //  Init snakeSection array
  for (var i = 1; i <= numSnakeSections-1; i++)
  {
      snakeSection[i] = game.add.sprite(400, 300, 'ball');
      snakeSection[i].anchor.setTo(0.5, 0.5);
  }
  
  //  Init snakePath array
  for (var i = 0; i <= numSnakeSections * snakeSpacer; i++)
  {
      snakePath[i] = new Phaser.Point(400, 300);
  }

  // The base of our player
  var startX = Math.round(Math.random() * (1000) - 500);
  var startY = Math.round(Math.random() * (1000) - 500);
  player = game.add.sprite(startX, startY, 'dude');
  apple = game.add.sprite(randomizedStart(), randomizedStart(), 'apple');
  snake = game.add.sprite(randomizedStart(), randomizedStart(), 'snakehead');
  game.physics.arcade.enable(player);
  game.physics.arcade.enable(snake);
  player.anchor.setTo(0.5, 0.5);
  player.animations.add('move', [0, 1, 2, 3, 4, 5, 6, 7], 20, true);
  player.animations.add('stop', [3], 20, true);

  // This will force it to decelerate and limit its speed
  player.body.drag.setTo(200, 200);
  player.body.maxVelocity.setTo(400, 400);
  player.body.collideWorldBounds = true;
  snake.body.collideWorldBounds = true;
  // Create some baddies to waste :)
  enemies = [];

  player.bringToTop();

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

  // Player removed message received
  socket.on('remove player', onRemovePlayer);
}

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
    return
  }

  // Update player position
  movePlayer.player.x = data.x
  movePlayer.player.y = data.y
}

// Remove player
function onRemovePlayer (data) {
  var removePlayer = playerById(data.id)

  // Player not found
  if (!removePlayer) {
    console.log('Player not found: ', data.id)
    return
  }

  removePlayer.player.kill()

  // Remove player from array
  enemies.splice(enemies.indexOf(removePlayer), 1)
}

function update () {
  snake.body.x += .1;
  game.physics.arcade.collide(snake, player);
  game.physics.arcade.overlap(snakeHead, player, collisionHandler, null, this);
  for (var i = 0; i < enemies.length; i++) {
    if (enemies[i].alive) {
      enemies[i].update()
      game.physics.arcade.collide(player, enemies[i].player)
    }
  }
   if (keys.left.isDown) {
    player.angle -= 5
  }

  /* else if (keys.right.isDown) {
    player.angle += 4
  } */

  /* if (keys.up.isDown) {
    player.angle += 10
  } else if (keys.down.isDown) {
    player.angle -= 10
  } */

  if (keys.up.isDown)  {
    currentSpeed = 200
  } else {
    if (currentSpeed > 0) {
      currentSpeed -= 100;
    }
  }

  if (currentSpeed > 0) {
    game.physics.arcade.velocityFromRotation(player.rotation, currentSpeed, player.body.velocity)

    player.animations.play('move')
  } else {
    player.animations.play('stop')
  }

  land.tilePosition.x = -game.camera.x
  land.tilePosition.y = -game.camera.y

  /* if (game.input.activePointer.isDown) {
    if (game.physics.distanceToPointer(player) >= 10) {
      currentSpeed = 300

      player.rotation = game.physics.angleToPointer(player)
    }
  } */

  socket.emit('move player', { x: player.x, y: player.y })
  snakeHead.body.velocity.setTo(0, 0);
    snakeHead.body.angularVelocity = 0;

    if (keys.up.isDown)
    {
        snakeHead.body.velocity.copyFrom(game.physics.arcade.velocityFromAngle(snakeHead.angle, 300));

        // Everytime the snake head moves, insert the new location at the start of the array, 
        // and knock the last position off the end

        var part = snakePath.pop();

        part.setTo(snakeHead.x, snakeHead.y);

        snakePath.unshift(part);

        for (var i = 1; i <= numSnakeSections - 1; i++)
        { 
            snakeSection[i].x = (snakePath[i * snakeSpacer]).x;
            snakeSection[i].y = (snakePath[i * snakeSpacer]).y;
        }
    }

    if (keys.left.isDown)
    {
        snakeHead.body.angularVelocity = -300;
    }
    else if (keys.right.isDown)
    {
        snakeHead.body.angularVelocity = 300;
    }

}

//will need to put socket.emit('move player', { x: player.x, y: player.y })
function render () {

}

// Find player by ID
function playerById (id) {
  for (var i = 0; i < enemies.length; i++) {
    if (enemies[i].player.name === id) {
      return enemies[i]
    }
  }

  return false
}

function collisionHandler (snake, player) {

    //  When a snake hits an player we kill them both
    //snake.kill();
    player.kill();
    numSnakeSections++;
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

}
