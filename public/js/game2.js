// mods by Patrick OReilly 
// Twitter: @pato_reilly Web: http://patricko.byethost9.com

var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'phaser-example', { preload: preload, create: create, update: update, render: render });

function preload() {

    game.load.spritesheet('dude', 'assets/dude.png', 64, 64);
    game.load.image('ball', 'assets/shinyball.png');
    
}

var image;

function create() {
    knocker = game.add.sprite(400, 200, 'dude');
    knocker.animations.add('move', [0, 1, 2, 3, 4, 5, 6, 7], 20, true);
    knocker.animations.add('stop', [3], 20, true);
    game.physics.startSystem(Phaser.Physics.ARCADE);

    cursors = game.input.keyboard.createCursorKeys();

    //  This creates a simple sprite that is using our loaded image and
    //  displays it on-screen
    //  and assign it to a variable
    ball = game.add.sprite(400, 200, 'ball');

    knocker = game.add.sprite(400, 200, 'dude');

 knocker2 = game.add.sprite(600, 200, 'dude');
    game.physics.enable([knocker,ball, knocker2], Phaser.Physics.ARCADE);

    //knocker.body.immovable = true;

    //  This gets it moving
    ball.body.velocity.setTo(200, 200);
    knocker2.body.velocity.setTo(700, 700);
    //  This makes the game world bounce-able
    ball.body.collideWorldBounds = true;
    knocker.body.collideWorldBounds = true;
    knocker2.body.collideWorldBounds = true;
    //  This sets the image bounce energy for the horizontal 
    //  and vertical vectors (as an x,y point). "1" is 100% energy return
    ball.body.bounce.setTo(1, 1);
    knocker.body.bounce.setTo(.75, .75);
    knocker2.body.bounce.setTo(.75, .75);

}

//  Move the knocker with the arrow keys
function update () {
  var currentSpeed = 200;
    //  Enable physics between the knocker and the ball
    game.physics.arcade.collide(knocker, ball);
    game.physics.arcade.collide(knocker, knocker2);
    game.physics.arcade.collide(knocker2, ball, onCollision);
    function onCollision(a, b){
      a.kill();
    }

    if (cursors.up.isDown)
    {
        knocker.body.velocity.y = -300;
        knocker.animations.play('move');
    }
    else if (cursors.down.isDown)
    {
        knocker.body.velocity.y =  300;
        knocker.animations.play('move');
    }
    else if (cursors.left.isDown)
    {
      game.physics.arcade.velocityFromRotation(knocker.rotation, currentSpeed, knocker.body.velocity);
        knocker.angle -= 5;
        //knocker.body.velocity.x = -300;
        knocker.animations.play('move');
    }
    /* else if (cursors.right.isDown)
    {
      game.physics.arcade.velocityFromRotation(knocker.rotation, currentSpeed, knocker.body.velocity);
        knocker.angle += 5;
        //knocker.body.velocity.x = 300;
        knocker.animations.play('move');
    } */
    else
    {
      knocker.animations.play('stop');
    //knocker.body.velocity.setTo(decel(knocker.body.velocity.x), decel(knocker.body.velocity.y));
    }
}

function render () {

    //debug helper
    game.debug.spriteInfo(ball, 32, 32);

}