window.addEventListener('load', function() {

    // players number in list
    let playerNum;

    // get server to connect to and connect
    const serverIP = prompt("Enter the local IP:port of the server you are connecting to, or public DNS if using the public server.")
    const socket = io(serverIP, {secure: true})
    socket.on('init', handleInit);

    // player initiation; recieves index in player list from server
    function handleInit(msg) {
        playerNum = msg;
        
        socket.on('newstate', load);
        socket.on('newplayernum', changePlayerNum);
        

        // canvas setup
        const canvas = document.getElementById('canvas1');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        socket.emit('winsize', playerNum, [canvas.width, canvas.height])

        // input handler, just sends input to the server
        class InputHandler {
            constructor() {
                window.addEventListener('mousemove', event => {
                    socket.emit('mousemove', playerNum, event.clientX, event.clientY);
                })
                window.addEventListener('keydown', event => {
                    socket.emit('keydown', playerNum, event.key);
                })
                window.addEventListener('keyup', event => {
                    socket.emit('keyup', playerNum, event.key);
                })
                window.addEventListener('mousedown', event => {
                    socket.emit('mousedown', playerNum);
                })
                window.addEventListener('mouseup', event => {
                    socket.emit('mouseup', playerNum);

                })


            }
        }
        input = new InputHandler();

        // load game state
        function load(state) {
            // get state
            state = JSON.parse(state);
            thisplayer = state.players[playerNum]

            // reset canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // draw players
            state.players.forEach(player => {

                // check whether player is on screen
                if (thisplayer.winpos[0][0] - player.width < player.x < thisplayer.winpos[0][1] + player.width && 
                    thisplayer.winpos[1][0] - player.height < player.y < thisplayer.winpos[1][1] + player.height) {
                    console.log('winpos: ' + thisplayer.winpos)
                    console.log('coords: ' + [player.x, player.y])
                    console.log('relative coords: ' + [player.x - thisplayer.winpos[0][0], player.y - thisplayer.winpos[1][0]])
                    ctx.fillRect(player.x - thisplayer.winpos[0][0], player.y - thisplayer.winpos[1][0], player.width, player.height);
                }
            })

            // draw bullets
            state.bullets.forEach(bullet => {

                // check whether bullet is on screen
                if (thisplayer.winpos[0][0] - bullet.width < bullet.x < thisplayer.winpos[0][1] + bullet.width && thisplayer.winpos[1][0] - bullet.height < bullet.y < thisplayer.winpos[1][1] + bullet.height) {
                    ctx.fillRect(bullet.x - thisplayer.winpos[0][0], bullet.y - thisplayer.winpos[1][0], bullet.width, bullet.height);
                }
            })

            // allow for resizing window and game updating with it
            if (canvas.width != window.innerWidth) {
                canvas.width = window.innerWidth;
                socket.emit('winsize', playerNum, [canvas.width, canvas.height])
            }
            if (canvas.height != window.innerHeight) {
                canvas.height = window.innerHeight;
                socket.emit('winsize', playerNum, [canvas.width, canvas.height])
            }

            // hud
            ctx.font = '20px Arial';
            ctx.fillText(thisplayer.ammo, canvas.width - 50, canvas.height - 50)
            ctx.fillText(thisplayer.weapon, 50, canvas.height - 50)
            

            if (thisplayer.reloadTimer != 0) {
                ctx.fillText((thisplayer.reloadTimer / 1000).toFixed(1), canvas.width / 2, canvas.height - 50)
            }
        }

        // get new index in player list, ie if someone disconnects
        function changePlayerNum(playernum) {
            playerNum = playernum;
            
        }
    }


})