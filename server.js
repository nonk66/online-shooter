const FRAMERATE = 100;
const ip = require('ip');

class Weapon {
    constructor(name, range, speed, maxAmmo, reloadTime, fireMode /* 0 is semi, 1 is burst, 2 is auto */, fireRate /* 0 if semi */, burstLength /* 1 if semi or auto */, burstDelay /* 0 if semi or auto */){
        this.name = name;
        this.range = range; // bullet range before it despawns
        this.speed = speed; // bullet speed
        this.maxAmmo = maxAmmo; // ammo capacity
        this.currentAmmo = maxAmmo; 
        this.reloadTime = reloadTime * 1000, 
        this.fireMode = fireMode; // 0 is semi, 1 is burst, 2 is auto
        this.fireRate = fireRate; // per second. applies to all 3 modes. for burst, it's during a burst
        this.burstLength = burstLength; // number of bullets in one burst
        this.burstDelay = burstDelay * 1000; // minimum delay between bursts
        this.justShot = false; // shot last frame
        this.shotTimer = 0; // time since shot
        this.burstCounter = 0; // how many bullets have been shot in the current burst
        this.justBurstFired = false; // same as justShot but for burst
        this.burstTimer = 0; // time since burst

    }
    update(){

        // check whether player shot last frame, track time since shot, check against firerate to see if can fire
        if (this.justShot){
            this.shotTimer += 1000 / FRAMERATE;
        }  
        if (this.shotTimer > 1000 / this.fireRate){
            this.shotTimer = 0;
            this.justShot = false;
        } 

        // same thing but for bursts
        if (this.fireMode === 1){
            if (this.justBurstFired){
                this.burstTimer += 1000 / FRAMERATE;
            }
            if (this.burstTimer > this.burstDelay){
                this.burstTimer = 0;
                this.justBurstFired = false;
            }
        }
    }
}






class Player {
    constructor(game, num){
        this.game = game;
        this.name = num; // position in player list, ie player 1, player 2 etc
        this.keys = []; // comes from client updates
        this.speed = 5; // movement speed
        this.x = 800; // x pos
        this.y = 450; // y pos
        this.width = 25; // sprite width
        this.height = 25; // sprite height
        this.weapons = [new Weapon('Handgun', 1000, 18, 12, 1, 0, 5, 1, 0), new Weapon('Rifle', 2000, 18, 12, 1, 1, 10, 3, 0.5)]
        this.weapon = this.weapons[0]; // weapon player is holding
        this.hasShotThisClick = false; // to prevent continued shooting while holding in semi or burst
        this.isReloading = false; // currently reloading or not
        this.reloadTimer = 0; // time spent on current reload
        this.mouseX = 0; // cursor x pos
        this.mouseY = 0; // cursor y pos
    }
    update(){

        // reloading mechanism
        if (this.isReloading){
            this.reloadTimer -= 1000 / FRAMERATE;
            if (this.reloadTimer <= 0){
                this.isReloading = false;
                this.weapon.currentAmmo = this.weapon.maxAmmo;
                this.reloadTimer = 0;
            }
        }

        // movement
        if (this.keys.includes('d')){
            this.x += this.speed;
        }
        if (this.keys.includes('s')){
            this.y += this.speed;
        }
        if (this.keys.includes('a')){
            this.x -= this.speed;
        }
        if (this.keys.includes('w')){
            this.y -= this.speed;
        }

        // checks for whether player can fire when they click
        if ((this.keys.includes('click') && !this.hasShotThisClick && !this.weapon.justShot && !this.weapon.justBurstFired) || 
        (0 < this.weapon.burstCounter && this.weapon.burstCounter < this.weapon.burstLength && !this.weapon.justShot)){
            
            // checks whether ammo is there to fire
            if (this.weapon.currentAmmo > 0 && !this.isReloading){
                this.shoot(this.x + this.width / 2, this.y + this.height / 2, this.mouseX, this.mouseY);
                this.weapon.justShot = true;
                this.weapon.currentAmmo -= 1;
            }

            // to prevent repeated firing while pressing mouse, except when full auto since we want that
            if (!(this.weapon.fireMode === 2) && this.weapon.burstCounter === 0) {
                this.hasShotThisClick = true;
            }
            
            this.weapon.burstCounter += 1;

            // stops burst when the burst length has been fired
            if (this.weapon.burstCounter === this.weapon.burstLength) {
                this.weapon.burstCounter = 0;
                if (this.weapon.fireMode === 1){
                    this.weapon.justBurstFired = true;
                }
            }
        }
    }

    shoot(startX, startY, xcor, ycor){
        // distx and y used for getting slope in projectile code
        const distX = (this.x + this.width * 0.5) - xcor;
        const distY = ycor - (this.y + this.height * 0.5);
        let rightOrLeft = 0; // used in projectile code to figure out which way to move along slope
        if (xcor < this.x + this.width * 0.5) {
            rightOrLeft = 1;
        } 
        
        // spawn projectile
        this.game.bullets.push(new Projectile(startX, startY, distX, distY, rightOrLeft, this.weapon.speed, this.weapon.range));
    }
    reload(){
        this.isReloading = true; // self-explanatory i think
    }
}

// player data transfer object with only data the client needs
class PlayerDTO {
    constructor(x, y, width, height, ammo, reloadTimer) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.ammo = ammo;
        this.reloadTimer = reloadTimer;
    }
}

class Projectile {
    constructor(x, y, distX, distY, rightOrLeft, speed, range){
        this.distX = distX; // dist from spawn pos to mouse
        this.distY = distY; // ^^
        this.rightOrLeft = rightOrLeft; // 0 is right, 1 is left
        this.x = x; // x pos
        this.y = y; // y pos
        this.speed = speed; // bullet speed
        this.xTravelled = 0; // dist travelled
        this.yTravelled = 0; // ^^
        this.range = range; // max dist
        this.markedForDeletion = false; // whether it will despawn this frame

    }
    update(){
        const slope = this.distY / this.distX // yeah


        // checking for straight lines
        if (this.distX === 0){
            if (this.distY > 0){
                this.y += this.speed;
                this.yTravelled += this.speed;
            } else {
                this.y -= this.speed;
                this.yTravelled += this.speed;
            }
        } else if (this.distY === 0){
            if (this.distX > 0){
                this.x -= this.speed;
                this.xTravelled += this.speed;
            } else {
                this.x += this.speed;
                this.xTravelled += this.speed;
            }


    
        // magic code for figuring out direction. was revealed to me in a dream. not sure how it works
        } else if (this.rightOrLeft === 0){
            if (slope > 1){
                this.y -= this.speed;
                this.yTravelled += this.speed;
                this.x += this.speed / slope;
                this.xTravelled += this.speed / slope;
            } else if (slope < -1){
                this.y += this.speed;
                this.yTravelled += this.speed;
                this.x -= this.speed / slope;
                this.xTravelled += this.speed / slope;
            } else {
                this.y -= this.speed * slope;
                this.yTravelled += this.speed * slope;
                this.x += this.speed;
                this.xTravelled += this.speed;
                
            }



        } else {
            if (slope > 1){
                this.y += this.speed;
                this.yTravelled += this.speed;
                this.x -= this.speed / slope;
                this.xTravelled += this.speed / slope;
            } else if (slope < -1){
                this.y -= this.speed;
                this.yTravelled += this.speed;
                this.x += this.speed / slope;
                this.xTravelled += this.speed / slope;
            } else {
                this.y += this.speed * slope;
                this.yTravelled += this.speed * slope;
                this.x -= this.speed;
                this.xTravelled += this.speed;

            }
        }


        // see whether bullet has gone its max distance
        if (Math.sqrt(this.xTravelled ** 2 + this.yTravelled ** 2) > this.range){
            this.markedForDeletion = true;
        }
    }


}


class UI { // User Interface 
    constructor(game){
        this.game = game;
        this.fontSize = 20;
        this.fontFamily = 'Helvetica';
        this.color = 'black';
    }

}

class Enemy { // opposition
    constructor(game){
        this.game = game;
    }

}

let playerDTOs = [];

class Game {
    constructor(width, height){
        this.width = width; // window width, updates as user resizes
        this.height = height; // window height
        this.players = [] 
        this.bullets = []

    }
    update(){
        this.players.forEach(player => {
            player.update();
            player.weapon.update();
            

        })

        // updating players and player DTOs for transfer
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].update();
            this.players[i].weapon.update();
            playerDTOs[i].x = this.players[i].x;
            playerDTOs[i].y = this.players[i].y;
            playerDTOs[i].width = this.players[i].width;
            playerDTOs[i].height = this.players[i].height;
            playerDTOs[i].ammo = this.players[i].ammo;
            playerDTOs[i].reloadTimer = this.players[i].reloadTimer;
        }

        // updating bullets
        this.bullets.forEach(bullet => {
            bullet.update();
        })

        // despawn bullets
        this.bullets = this.bullets.filter(bullet => !bullet.markedForDeletion);
        
    }

}

class Connection { // pretty sure this is unused
    constructor(client, num) {
        this.client = client;
        this.num = num;
    }
}

// magic code for starting server
const { createServer } = require("http");
const { Server } = require("socket.io");

const httpServer = createServer();

const io = new Server(httpServer, {
    cors: {
        // was getting cors errors so like idk put this. maybe not secure
        origin: "*",
        methods: ['GET', 'PUT', 'POST']
    }
})




const game = new Game(1600, 900);

let connections = [];

const weaponSlots = [1, 2]

io.on('connection', client => {
    connections.push(client); // add player to connections list
    const thisPlayer = connections.indexOf(client); // thisPlayer is the same as player.num i think
    game.players.push(new Player(game, thisPlayer)) // create player object for client
    playerDTOs.push(new PlayerDTO(game.players[thisPlayer].x, game.players[thisPlayer].y, game.players[thisPlayer].width, game.players[thisPlayer].height, game.players[thisPlayer].ammo, game.players[thisPlayer].reloadTimer))
    // ^^ creating player DTO for player, copies properties from player object
    address = client.handshake.address; // ip address of client
    client.emit('init', thisPlayer); // send init message to client along with player number
    console.log(thisPlayer);
    client.on('mousemove', handleMouseMovement); // when recieve mouse movement update mousse pos

    function handleMouseMovement(playernum, x, y) {
        game.players[playernum].mouseX = x;
        game.players[playernum].mouseY = y;

    }


    client.on('keydown', handleKeyDown); // handle keyboard input from client

    function handleKeyDown(playernum, key) {

        // movement
        if ((key === 'd' ||
            key === 's' ||
            key === 'a' ||
            key === 'w') &&
            game.players[playernum].keys.indexOf(key) === -1) {
            game.players[playernum].keys.push(key);

        // reloading
        } else if (key === 'r' &&
            !game.players[playernum].isReloading &&
            !(game.players[playernum].weapon.currentAmmo > game.players[playernum].maxAmmo)) {
            game.players[playernum].reloadTimer = game.players[playernum].weapon.reloadTime;
            game.players[playernum].reload();

        // switching weapons with number keys
        } else if (weaponSlots.includes(parseInt(key)) && game.players[playernum].weapon != game.players[playernum].weapons[parseInt(key) - 1]) {
            game.players[playernum].weapon = game.players[playernum].weapons[parseInt(key) - 1];
            if (game.players[playernum].isReloading) {
                game.players[playernum].isReloading = false;
                game.players[playernum].reloadTimer = 0;
            }
        }
    }

    // when client releases key
    client.on('keyup', handleKeyUp);
    function handleKeyUp(playernum, key) {
        if (game.players[playernum].keys.indexOf(key) > -1) {
            game.players[playernum].keys.splice(game.players[playernum].keys.indexOf(key), 1)
        }
    }


    // click handling, firing of weapon
    client.on('mousedown', handleMouseDown)
    function handleMouseDown(playernum) {
        if (!game.players[playernum].isReloading) {
            if (game.players[playernum].weapon.burstCounter === 0) {
                if (game.players[playernum].keys.indexOf('click') === -1) {
                    game.players[playernum].keys.push('click');
                }
            }
        }
    }

    // when client unclicks. idk the word. releases mouse button
    client.on('mouseup', handleMouseUp)
    function handleMouseUp(playernum) {
        if (game.players[playernum].keys.indexOf('click') > -1) {
            game.players[playernum].keys.splice(game.players[playernum].keys.indexOf('click'), 1);
            game.players[playernum].hasShotThisClick = false;
        }
    } 
    
    // disconnection handling. this might be broken
    client.on('disconnect', function() { 
        console.log('disconnected')
        // taking player out of various lists
        game.players.splice(thisPlayer, 1);
        playerDTOs.splice(thisPlayer, 1);
        connections.splice(thisPlayer, 1);

        // giving remaining players their new indices in lists. eg player 2 becomes player 1 if player 1 leaves
        if (connections.length != 0) {
            connections.forEach(connection => {
                connection.emit('newplayernum', connections.indexOf(connection));
            })
        }
        
        console.log('disconnected')
    })
})



// game state to send to clients for drawing on screen
function createGameState(){
    return {
        players: playerDTOs,
        bullets: game.bullets

    }
}

// game loop to send game state to clients every frame
function startGameInterval() {
    const intervalId = setInterval(() => {
        io.emit('newstate', JSON.stringify(createGameState()));
        game.update();


    }, 1000 / FRAMERATE);
}

startGameInterval();

// listen on port 3000
io.listen(3000);

console.log('listening on ' + ip.address() + ':3000')
