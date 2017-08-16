<template>
    <canvas></canvas>
</template>

<script>
    import { walls, areas, getInitialSnake, areaDots } from './map';

    // Styling
    let wallColor = '#D9D9D9';
    const snakeColor = '#0ebcea';
    const areaColor = '#F0F0F0';
    const candyColor = '#000';

    // Konami
    const secret = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];

    const directions = {
        UP: { x: 0, y: -10 },
        DOWN: { x: 0, y: 10 },
        LEFT: { x: -10, y: 0 },
        RIGHT: { x: 10, y: 0 }
    };

    const KEYCODES = {
        UP: 38,
        DOWN: 40,
        LEFT: 37,
        RIGHT: 39
    }

    export default {
        data() {
            return {
                // Gamestate
                candy: [],
                walls: walls,
                score: 0,
                snake: getInitialSnake(),
                direction: 'DOWN',

                // Prevent direction-reverse in a single update-frame
                updateHasInput: false,
                bufferedInput: null,

                // AI-Challenge (should maybe not be in this file?)
                aiWebWorker: null,

                // Timings
                tickIntervalBase: 150,
                tickIntervalRange: 130,
                numCandyOnMap: 25,

                // Replay
                updateFrame: 0,
                updateTimeout: -1,
                updateListeners: [],
                replayActive: false,
                gameHistory: {
                    u: [], d: [], l: [], r: [], c: []
                },
                secretHistory: []
            }
        },
        computed: {
            tickInterval() {
                let calc1 = 1/(Math.pow(this.score + 10, 0.1));
                let calc2 = 1-((1- calc1) * 2);
                let calc3 = (calc2-0.2) * 2.5;
                let calc4 = calc3 * this.tickIntervalRange + (this.tickIntervalBase - this.tickIntervalRange);
                return (this.replayActive) ? calc4 / 10 : calc4;
            },
            snakeHead() {
                let snakeHead = this.snake[this.snake.length - 1];
                return snakeHead;
            }
        },
        methods: {
            setScore(newScore) {
                this.score = newScore;
                this.$emit('score-change', this);
            },
            collisionCheck() {
                // We only need to check for collisions with the head
                let snakeHead = this.snakeHead;

                // Check for collisions between the snake-head and this.walls
                for(let wall of this.walls) {
                    if(snakeHead.x < wall.x0) continue;
                    if(snakeHead.x > (wall.x1 - 1)) continue;
                    if(snakeHead.y < wall.y0) continue;
                    if(snakeHead.y > wall.y1  - 1) continue;
                    return true;
                }

                // Check for collisions with the snake-tail
                for(let i = 0; i < (this.snake.length - 1); i++) {
                    let snakeTail = this.snake[i];
                    if(snakeHead.x === snakeTail.x && snakeHead.y === snakeTail.y) {
                        return true;
                    }
                }

                return false;
            },
            resetGame() {
                // Clear map
                this.setScore(0);
                this.candy.length = 0;

                // Clear history
                for(var key in this.gameHistory){
                    this.gameHistory[key].length = 0;
                }

                // Reset our snake
                this.direction = 'DOWN';
                this.snake = getInitialSnake();

                // Reset updateFrame
                this.updateFrame = 0;
                // Clear updateTimeout
                clearTimeout(this.updateTimeout);

            },
            restartGame() {
                this.resetGame();
                this.placeCandy(this.numCandyOnMap);
                this.update();
            },
            getAvailableCandyLocations() {
                // clone areaDots, excluding snake-bits and candy bits
                let availableSpaces = {};
                Object.entries(areaDots).forEach((entry) => {
                    let key = entry[0];
                    let value = entry[1];
                    
                    availableSpaces[key] = { x: value.x, y: value.y };
                });

                // Remove the snake bits from our available spaces
                this.snake.forEach((snakeBit) => {
                    let ident = snakeBit.x + ',' + snakeBit.y;
                    delete availableSpaces[ident];
                });

                // Remove the candy bits from our available spaces
                this.candy.forEach((candyBit) => {
                    let ident = candyBit.x + ',' + candyBit.y;
                    delete availableSpaces[ident];
                });

                return availableSpaces;
            },
            candyCheck(pos) {
                let candyIndex = -1;
                this.candy.forEach((bite, index) => {
                    if(pos.x == bite.x && pos.y == bite.y) {
                        candyIndex = index;
                    }
                });
                return candyIndex;                
            },
            placeCandy(num = 1) {
                let locations = this.getAvailableCandyLocations();
                let keys = Object.keys(locations);

                for(let i = 0; i < num; i++) {
                    let random = Math.floor(Math.random() * keys.length);
                    let location = locations[keys[random]];

                    this.candy.push({ x: location.x, y: location.y });
                    this.gameHistory.c.push({ u: this.updateFrame.toString(36), x: location.x.toString(36), y: location.y.toString(36) });
                    if(this.aiWebWorker !== null) this.aiWebWorker.postMessage({
                        type: 'candy',
                        data: { x: location.x, y: location.y }
                    });            
                }
            },

            // Draw functions
            drawCandy() {
                this.candy.forEach((bite) => {
                    this.context.beginPath();
                    this.context.rect(bite.x, bite.y, 10, 10);
                    this.context.fillStyle = candyColor;
                    this.context.fill();
                });
            },
            drawAreas() {
                areas.forEach((area) => {
                    this.context.beginPath();
                    this.context.rect(area.x0, area.y0, area.x1 - area.x0, area.y1 - area.y0);
                    this.context.fillStyle = areaColor;
                    this.context.fill();
                });
            },
            drawSnake() {
                this.snake.forEach((snakeBit) => {
                    this.context.beginPath();
                    this.context.rect(snakeBit.x, snakeBit.y, 10, 10);
                    this.context.fillStyle = snakeColor;
                    this.context.fill();
                });
            },
            drawWalls() {
                this.walls.forEach((wall) => {
                    this.context.beginPath();
                    this.context.rect(wall.x0, wall.y0, wall.x1 - wall.x0, wall.y1 - wall.y0);
                    this.context.fillStyle = wallColor;
                    this.context.fill();
                });
            },
            draw() {
                this.context.clearRect(0, 0, this.context.width, this.context.height);
                this.drawWalls();
                this.drawAreas();
                this.drawCandy();
                this.drawSnake();

                requestAnimationFrame(this.draw.bind(this));
            },

            // Replays
            replayHistory(history) {
                // Clear current frameUpdate
                clearTimeout(this.updateTimeout);

                // Set game to initial state
                this.resetGame();
                this.gameHistory = history;

                // Set replayActive true, it is automatically disabled on every gameover
                this.replayActive = true;

                // Create system to input 
                this.updateListeners.push(() => {
                    // Replay movement input
                    let updateFrameStr =this.updateFrame.toString(36);
                    if(history.l && history.l.indexOf(updateFrameStr) >= 0){
                        this.direction = 'LEFT';
                    }
                    else if(history.r && history.r.indexOf(updateFrameStr) >= 0){
                        this.direction = 'RIGHT';
                    }
                    else if(history.u && history.u.indexOf(updateFrameStr) >= 0){
                        this.direction = 'UP';
                    }
                    else if(history.d && history.d.indexOf(updateFrameStr) >= 0){
                        this.direction = 'DOWN';
                    }

                    // Replay candy placements
                    history.c
                        .filter((item) => item.u === updateFrameStr)
                        .forEach((item) => this.candy.push({ x: parseInt(item.x, 36), y: parseInt(item.y, 36) }));
                });

                this.update();
            },
            disableReplay() {
                this.replayActive = false;
                this.updateListeners = [];
            },

            // Update Gamestate
            update() {
                // Execute update handlers before executing update
                this.$emit('update', this);
                this.updateListeners.forEach((callback) => callback());

                // Move our snake
                // I think I can change this to splice(tail) + push(new head)
                let move = directions[this.direction];
                let tailEnd = { x: this.snake[0].x, y: this.snake[0].y };
                for(let i = 0; i < this.snake.length; i++) {
                    if(i + 1 == this.snake.length) {
                        // This is the head
                        this.snake[i].x += move.x;
                        this.snake[i].y += move.y;
                    }
                    else {
                        // This is the tail
                        this.snake[i].x = this.snake[i + 1].x
                        this.snake[i].y = this.snake[i + 1].y
                    }
                }

                let candyFoundTailIndex = this.candyCheck(tailEnd);
                let candyFoundHeadIndex = this.candyCheck(this.snake[this.snake.length - 1]);
                // When the tail end of the snake hits the candy, append the tail
                if(candyFoundTailIndex >= 0) {
                    this.candy.splice(candyFoundTailIndex, 1);
                    this.snake.unshift({ x: tailEnd.x , y: tailEnd.y });
                }
                // When the head of the snake hits the candy, increase score and add a new candy to the board
                if(candyFoundHeadIndex >= 0) {
                    this.setScore(this.score + 1);
                    if(!this.replayActive) this.placeCandy();
                }

                // Increment updateFrame before whatever happens next
                this.updateFrame++;

                // Check if you died, if not- queue the next update
                if(this.collisionCheck()) {
                    this.$emit('gameover', this);
                }
                else {
                    let frameDelay = this.tickInterval;
                    this.updateTimeout = setTimeout(this.update.bind(this), frameDelay);
                    if(this.aiWebWorker !== null) this.aiWebWorker.postMessage({
                        type: 'update',
                        data: {
                            updateFrame: updateFrame - 1,
                            direction: this.direction,
                            frameDelay
                        }
                    });
                }

                // Update input status
                this.updateHasInput = false;
                // If there is buffered input, throw it in
                if(this.bufferedInput) {
                    // If we have buffered input, proces that before executing the next update
                    this.inputHandler(this.bufferedInput);
                    this.bufferedInput = null;
                }                
            },
            // Handle input
            inputHandler(e) {
                if(this.replayActive) return;

                // This block of code is intentionally a bit hard to read, given that it relates to secret things ;)
                this.secretHistory.push(e.keyCode);
                while(this.secretHistory.length > secret.length) this.secretHistory.splice(0, 1);
                if(this.secretHistory.length == secret.length && this.secretHistory.every((v,i) => v === secret[i])) {
                    this.setScore(this.score + 50);
                    wallColor = '#B00B13';
                    this.numCandyOnMap += 250;
                    this.placeCandy(250);
                }
                
                // Buffer input if a key has already been pressed during this update
                if(this.updateHasInput === true) {
                    this.bufferedInput = e;
                    return;
                }

                // If input=up-arrow and direction isn't currently vertical
                if(e.keyCode == KEYCODES.UP && this.direction != 'DOWN' && this.direction != 'UP'){
                    this.direction = 'UP';
                    this.updateHasInput = true;
                    this.gameHistory.u.push(this.updateFrame.toString(36));
                    e.preventDefault();
                }
                // If input=down-arrow and direction isn't currently vertical
                else if(e.keyCode == KEYCODES.DOWN && this.direction != 'DOWN' && this.direction != 'UP') {
                    this.direction = 'DOWN';
                    this.updateHasInput = true;
                    this.gameHistory.d.push(this.updateFrame.toString(36));
                    e.preventDefault();
                }
                // If input=left-arrow and direction isn't currently horizontal
                else if(e.keyCode == KEYCODES.LEFT && this.direction != 'RIGHT' && this.direction != 'LEFT'){
                    this.direction = 'LEFT';
                    this.updateHasInput = true;
                    this.gameHistory.l.push(this.updateFrame.toString(36));
                    e.preventDefault();
                }
                // If input=right-arrow and direction isn't currently horizontal
                else if(e.keyCode == KEYCODES.RIGHT && this.direction != 'RIGHT' && this.direction != 'LEFT'){ 
                    this.direction = 'RIGHT';
                    this.updateHasInput = true;
                    this.gameHistory.r.push(this.updateFrame.toString(36));
                    e.preventDefault();
                }
                
            }
        },
        mounted() {
            this.canvas = this.$el;
            this.context = this.canvas.getContext('2d');

            this.context.width = this.canvas.width = 1710;
            this.context.height = this.canvas.height = 610;
            
            window.addEventListener('keydown', this.inputHandler.bind(this));
            this.restartGame();
            requestAnimationFrame(this.draw.bind(this));
        }
    }

</script>

<style lang="scss">
</style>
