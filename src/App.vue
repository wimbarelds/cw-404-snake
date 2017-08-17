<template>
    <div id="app">
        <highscores
            @click-view-history="playbackHistory($event)"
            @click-restart="restartGame()"></highscores>
        <div id="titlebar">
            <h1>404 - Page not found</h1>
            <div class="score">{{ currentScore }}</div>
        </div>
        <div class="body-container">
            <div class="game-container">
                <game @gameover="gameover($event)" @score-change="updateScore($event)" @candy-placed="handleCandyPlaced($event)" @update="handleUpdate($event)"></game>
            </div>
        </div>
    </div>
</template>

<script>
    import Highscores from './highscores/highscores.vue';
    import Game from './game/game.vue';

    export default {
        name: 'app',
        data () {
            return {
                currentScore: 0,
                showHighscores: false,
                aiWebWorker: null
            }
        },
        computed: {
            highscores() {
                return this.$children[0];
            },
            game() {
                return this.$children[1];
            }
        },
        methods: {
            gameover(game) {
                this.score = game.score;
                this.highscores.setResult({
                    name: '',
                    score: game.score,
                    history: game.gameHistory,
                    valid: (this.aiWebWorker === null)
                });
                this.highscores.open();
                if(this.aiWebWorker !== null){
                    this.aiWebWorker.terminate();
                    this.aiWebWorker = null;
                }
            },
            updateScore(game) {
                this.currentScore = game.score;
            },
            playbackHistory(history) {
                this.game.replayHistory(history);
            },
            restartGame() {
                this.game.restartGame();
            },
            loadBot(url) {
                if(this.aiWebWorker !== null) {
                    console.error("Another webworker AI is still active");
                    return false;
                }
                if(typeof url !== "string"){
                    console.error("Invalid input, please provide the filename of the AI (as a string)");
                    console.log("Example: vm.loadBot('dist/bots/test-bot.js');")
                    return false;
                }

                // Reset gamestate
                this.game.resetGame();

                // Place initial candy
                this.game.placeCandy(this.game.numCandyOnMap);

                // Hide highscores
                this.highscores.show = false;

                // Handler for when the worker says it's ready
                const readyHandler = (e) => {
                    if(e.data !== "ready") return;
                    this.aiWebWorker.removeEventListener('message', readyHandler);
                    
                    // Start
                    // Append direction listeners
                    this.aiWebWorker.addEventListener('message', (e) => {
                        let command = e.data;
                        if(['LEFT', 'RIGHT', 'UP', 'DOWN'].indexOf(command) >= 0) {
                            this.game.direction = command;
                        }
                        else {
                            console.error('Invalid command, valid commands are "UP", "DOWN", "LEFT", "RIGHT"');
                            console.error('Received:', command);
                        }
                    });

                    // Inform the AI about our gamestate
                    this.aiWebWorker.postMessage({
                        type: 'start',
                        data: {
                            walls: JSON.parse(JSON.stringify(this.game.walls)),
                            snake: JSON.parse(JSON.stringify(this.game.snake)),
                            candy: JSON.parse(JSON.stringify(this.game.candy))
                        }
                    });

                    // Start the game
                    let frameDelay = this.game.tickInterval;
                    this.game.updateTimeout = setTimeout(this.game.update.bind(this.game), frameDelay);
                };

                // Create webworker
                this.aiWebWorker = new Worker(url);

                // When we receive the ready message, handle it
                this.aiWebWorker.addEventListener('message', readyHandler);

                // Setup error handling
                this.aiWebWorker.addEventListener('error', (e) => {
                    console.error("An error was detected, webworker will now be killed.");
                    console.log(e);
                    this.aiWebWorker.terminate();
                    this.aiWebWorker = null;
                    this.highscores.open();
                });

                return this.aiWebWorker;
            },
            handleCandyPlaced(location) {
                if(this.aiWebWorker === null) return;
                this.aiWebWorker.postMessage({
                    type: 'candy',
                    data: location
                });
            },
            handleUpdate(updateData) {
                if(this.aiWebWorker === null) return;
                this.aiWebWorker.postMessage({
                    type: 'update',
                    data: updateData
                });
            }
        },
        components: {
            Highscores, Game
        },
        mounted() {
        }
    }
</script>

<style>
    html, body {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
    }

    canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }
</style>

<style lang="scss" scoped>
    #app {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        background-color: #333;
        overflow: hidden;
    }

    #titlebar {
        display: flex;
        color: #FFF;
        justify-content: space-between;
        padding: 10px;
    }

    h1 {
        font-family: Arial;
        padding: 0;
        margin: 0;
        font-size: 64px;
    }

    .score {
        font-family: Arial;
        font-size: 64px;
        font-weight: bold;

        &::before {
            content: 'Score: ';
            text-align: right;
            font-weight: normal;
        }
    }

    .body-container {
        display: flex;
        justify-content: center;
        align-items: center;
        flex: 1;
    }

    $game-width: 75vw;
    .game-container {
        width: $game-width;
        height: 0;
        padding-top: calc((610 / 1710) * #{$game-width});
        position: relative;
    }
</style>
