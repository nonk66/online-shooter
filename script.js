window.addEventListener('load', function() {
    let playerNum;
    const socket = io('http://99.199.14.254:3000');
    socket.on('init', handleInit);
    function handleInit(msg) {
        playerNum = msg;
        socket.on('newstate', load);

        // canvas setup
        const canvas = document.getElementById('canvas1');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
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

        function load(state) {
            state = JSON.parse(state);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            state.players.forEach(player => {
                ctx.fillRect(player.x, player.y, player.width, player.height);
            })
            state.bullets.forEach(bullet => {
                ctx.fillRect(bullet.x, bullet.y, 10, 10);
            })
            if (canvas.width != window.innerWidth) {
                canvas.width = window.innerWidth;
            }
            if (canvas.height != window.innerHeight) {
                canvas.height = window.innerHeight;
            }

        }
    }


})