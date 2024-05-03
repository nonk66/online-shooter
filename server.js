const FRAMERATE = 100;
const ip = require('ip');

class Weapon {
    constructor(name, range, speed, maxAmmo, reloadTime, fireMode /* 0 is semi, 1 is burst, 2 is auto */, fireRate /* 0 if semi */, burstLength /* 1 if semi or auto */, burstDelay /* 0 if semi or auto */){
        this.name = name;
        this.range = range;
        this.speed = speed;
        this.maxAmmo = maxAmmo;
        this.currentAmmo = maxAmmo;
        this.reloadTime = reloadTime * 1000,
        this.fireMode = fireMode;
        this.fireRate = fireRate;
        this.burstLength = burstLength;
        this.burstDelay = burstDelay * 1000;
        this.justShot = false;
        this.shotTimer = 0;
        this.burstCounter = 0;
        this.justBurstFired = false;
        this.burstTimer = 0;

    }
    update(){
        if (this.justShot){
            this.shotTimer += 1000 / FRAMERATE;
        }  
        if (this.shotTimer > 1000 / this.fireRate){
            this.shotTimer = 0;
            this.justShot = false;
        } 
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
        this.name = num;
        this.keys = []
        this.speed = 5;
        this.x = 800;
        this.y = 450;
        this.width = 25;
        this.height = 25;
        this.weapons = [new Weapon('Handgun', 1000, 18, 12, 1, 0, 5, 1, 0), new Weapon('Rifle', 2000, 18, 12, 1, 1, 10, 3, 0.5)]
        this.weapon = this.weapons[0];
        this.hasShotThisClick = false;
        this.isReloading = false;
        this.reloadTimer = 0;
        this.mouseX = 0;
        this.mouseY = 0;
    }
    update(){
        if (this.isReloading){
            this.reloadTimer -= 1000 / FRAMERATE;
            if (this.reloadTimer <= 0){
                this.isReloading = false;
                this.weapon.currentAmmo = this.weapon.maxAmmo;
                this.reloadTimer = 0;
            }
        }
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
        if ((this.keys.includes('click') && !this.hasShotThisClick && !this.weapon.justShot && !this.weapon.justBurstFired) || 
        (0 < this.weapon.burstCounter && this.weapon.burstCounter < this.weapon.burstLength && !this.weapon.justShot)){
            if (this.weapon.currentAmmo > 0 && !this.isReloading){
                this.shoot(this.x + this.width / 2, this.y + this.height / 2, this.mouseX, this.mouseY);
                this.weapon.justShot = true;
                this.weapon.currentAmmo -= 1;
            }
            if (!(this.weapon.fireMode === 2) && this.weapon.burstCounter === 0) {
                this.hasShotThisClick = true;
            }
            
            this.weapon.burstCounter += 1;

            if (this.weapon.burstCounter === this.weapon.burstLength) {
                this.weapon.burstCounter = 0;
                if (this.weapon.fireMode === 1){
                    this.weapon.justBurstFired = true;
                }
            }
        }
    }

    shoot(startX, startY, xcor, ycor){
        const distX = (this.x + this.width * 0.5) - xcor;
        const distY = ycor - (this.y + this.height * 0.5);
        let rightOrLeft = 0;
        if (xcor < this.x + this.width * 0.5) {
            rightOrLeft = 1;
        } 
        
        this.game.bullets.push(new Projectile(startX, startY, distX, distY, rightOrLeft, this.weapon.speed, this.weapon.range));
    }
    reload(){
        this.isReloading = true;
    }
}

class PlayerDTO {
    constructor(x, y, width, height, ammo) {
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
        this.distX = distX;
        this.distY = distY;
        this.rightOrLeft = rightOrLeft; // 0 is right, 1 is left
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.xTravelled = 0;
        this.yTravelled = 0;
        this.range = range;
        this.markedForDeletion = false;

    }
    update(){
        const slope = this.distY / this.distX
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



        if (Math.sqrt(this.xTravelled ** 2 + this.yTravelled ** 2) > this.range){
            this.markedForDeletion = true;
        }
    }


}

class UI {
    constructor(game){
        this.game = game;
        this.fontSize = 20;
        this.fontFamily = 'Helvetica';
        this.color = 'black';
    }

}

class Enemy {
    constructor(game){
        this.game = game;
    }

}

let playerDTOs = [];

class Game {
    constructor(width, height){
        this.width = width;
        this.height = height;
        this.players = []
        this.bullets = []

    }
    update(){
        this.players.forEach(player => {
            player.update();
            player.weapon.update();
            

        })

        for (let i = 0; i < this.players.length; i++) {
            this.players[i].update();
            this.players[i].weapon.update();
            playerDTOs[i].x = this.players[i].x;
            playerDTOs[i].y = this.players[i].y;
            playerDTOs[i].width = this.players[i].width;
            playerDTOs[i].height = this.players[i].height;
        }
        this.bullets.forEach(bullet => {
            bullet.update();
        })
        this.bullets = this.bullets.filter(bullet => !bullet.markedForDeletion);
        
    }

}

class Connection {
    constructor(client, num) {
        this.client = client;
        this.num = num;
    }
}


const { Server } = require("socket.io");

const io = new Server({
    cors: {
        origin: "*",
        methods: ['GET', 'PUT', 'POST']
    }
})




const game = new Game(1600, 900);

let connections = [];

const weaponSlots = [1, 2]

io.on('connection', client => {
    connections.push(client);
    const thisPlayer = connections.indexOf(client);
    game.players.push(new Player(game, thisPlayer))
    playerDTOs.push(new PlayerDTO(game.players[thisPlayer].x, game.players[thisPlayer].y, game.players[thisPlayer].width, game.players[thisPlayer].height,))
    address = client.handshake.address;
    client.emit('init', thisPlayer);
    console.log(thisPlayer);
    client.on('mousemove', handleMouseMovement);


    function handleMouseMovement(playernum, x, y) {
        game.players[playernum].mouseX = x;
        game.players[playernum].mouseY = y;

    }

    client.on('keydown', handleKeyDown);
    function handleKeyDown(playernum, key) {

        if ((key === 'd' ||
            key === 's' ||
            key === 'a' ||
            key === 'w') &&
            game.players[playernum].keys.indexOf(key) === -1) {
            game.players[playernum].keys.push(key);
        } else if (key === 'r' &&
            !game.players[playernum].isReloading &&
            !(game.players[playernum].weapon.currentAmmo > game.players[playernum].maxAmmo)) {
            game.players[playernum].reloadTimer = game.players[playernum].weapon.reloadTime;
            game.players[playernum].reload();
        } else if (weaponSlots.includes(parseInt(key)) && game.players[playernum].weapon != game.players[playernum].weapons[parseInt(key) - 1]) {
            game.players[playernum].weapon = game.players[playernum].weapons[parseInt(key) - 1];
            if (game.players[playernum].isReloading) {
                game.players[playernum].isReloading = false;
                game.players[playernum].reloadTimer = 0;
            }
        }
    }

    client.on('keyup', handleKeyUp);
    function handleKeyUp(playernum, key) {
        if (game.players[playernum].keys.indexOf(key) > -1) {
            game.players[playernum].keys.splice(game.players[playernum].keys.indexOf(key), 1)
        }
    }

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

    client.on('mouseup', handleMouseUp)
    function handleMouseUp(playernum) {
        if (game.players[playernum].keys.indexOf('click') > -1) {
            game.players[playernum].keys.splice(game.players[playernum].keys.indexOf('click'), 1);
            game.players[playernum].hasShotThisClick = false;
        }
    } 
    
    client.on('disconnect', function() { 
        console.log('disconnected')
        game.players.splice(thisPlayer, 1);
        playerDTOs.splice(thisPlayer, 1);
        connections.splice(thisPlayer, 1);
        if (connections.length != 0) {
            connections.forEach(connection => {
                connection.emit('newplayernum', connections.indexOf(connection));
            })
        }
        
        console.log('disconnected')
    })
})




function createGameState(){
    return {
        players: playerDTOs,
        bullets: game.bullets




    }
}

function startGameInterval() {
    const intervalId = setInterval(() => {
        io.emit('newstate', JSON.stringify(createGameState()));
        game.update();


    }, 1000 / FRAMERATE);
}

startGameInterval();


io.listen(3000);

console.log('listening on ' + ip.address() + ':3000')
