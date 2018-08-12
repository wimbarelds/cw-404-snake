<template>
    <div class="highscores" v-if="show">
        <div class="highscores__modal">
            <h3>Highscores</h3>
            <div class="highscores__modal__title">
                <div class="rank"></div>
                <div class="name">Name</div>
                <div class="action"></div>
                <div class="score">Score</div>
            </div>
            <div class="highscores__modal__records">
                <div class="highscores__modal__record" v-for="(record, index) in highscores">
                    <div class="rank" v-text="index + 1"></div>
                    <div class="name" v-text="record.name"></div>
                    <div class="action" @click="watchReplay(record.history)">Watch replay</div>
                    <div class="score" v-text="record.score"></div>
                </div>
            </div>
            <div v-if="score > 0" class="highscores__modal__result">
                <div class="highscores__modal__result_score">
                    Your score: <span class="highscores__modal__result__score__points" v-text="score"></span>
                </div>
                <div v-if="(resultIsHighscore && responseMessage == '')">
                    <strong>That's a highscore!</strong>
                    <div class="highscores__modal__result__form">
                        <input type="text" placeholder="Enter your name" class="input-text" v-model="name" @keydown.enter="submitScore">
                        <button class="button btn-submit" @click="submitScore">Submit</button>
                    </div>
                </div>
                <div v-if="responseMessage != ''">
                    <strong v-text="responseMessage" v-bind:style="{color: (responseStatus ? 'inherit' : '#B00B13')}"></strong>
                </div>
            </div>
            <button class="button btn-playagain" @click="playAgain">Play again</button>
        </div>
    </div>
</template>

<script>
    export default {
        name: 'highscores',
        data() {
            return {
                score: 0,
                result: {
                    name: '',
                    score: 0,
                    history: [],
                    valid: false
                },
                show: false,
                highscores: [],
                responseStatus: true,
                responseMessage: '',
                name: ''
            }
        },
        computed: {
            resultIsHighscore() {
                return (this.result.valid && this.highscores.length && this.score > this.highscores[this.highscores.length - 1].score);
            }
        },
        methods: {
            setResult: function(result){
                this.result = result;
                this.score = this.result.score;
                this.responseMessage = '';
            },
            submitScore: function(){
                this.result.name = this.name;

                fetch('https://git.wimbarelds.nl/404server/highscores.php', {
                    method: 'post',
                    body: JSON.stringify(this.result)
                })
                    .then((response) => response.json())
                    .then((jsonResponse) => {
                        this.highscores = jsonResponse.highscores;
                        this.responseMessage = jsonResponse.message;
                        this.responseStatus = jsonResponse.success;
                        this.name = "";
                    });
            },
            watchReplay: function(history){
                this.show = false;
                this.$emit('click-view-history', history);
            },
            playAgain: function(){
                this.show = false;
                this.$emit('click-restart');
            },
            open: function(){
                fetch('https://git.wimbarelds.nl/404server/highscores.php')
                    .then((response) => response.json())
                    .then((highscores) => {
                        this.highscores = highscores;
                        this.show = true;
                    });
            }
        }
    }
</script>

<style lang="scss" scoped>
    .highscores {
        position: fixed;
        width: 100%;
        height: 100%;
        left: 0;
        top: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: rgba(0,0,0,0.5);
        z-index: 10;
        font-family: arial;

        &__modal {
            border: solid #333 10px;
            background-color: #FFF;
            padding: 10px;

            &__title {
                font-weight: bold;
            }

            &__title, &__record {
                display: flex;
                line-height: 32px;
            }
            &__records {
                margin-bottom: 10px;
            }

            &__result {
                margin: 10px -10px;
                border-top: solid #333 1px;
                border-bottom: solid #333 1px;
                padding: 10px;
                background-color: #EEE;

                &__form {
                    display: flex;
                    margin-top: 10px;


                    .input-text {
                        flex: 1;
                        margin-right: 10px;
                        padding: 0 10px;
                    }
                    .input-text, .btn-submit {
                        height: 30px;
                        box-sizing: border-box;
                    }

                    .btn-submit {
                        background-color: #999;
                        &:hover {
                            background-color: #666;
                        }
                    }
                }
            }
        }
    }

    h3 {
        font-size: 200%;
        margin: 0 0 .5em;
        text-align: center;
        border-bottom: solid #666 2px;
    }

    .rank {
        width: 25px;
        font-weight: bold;
    }
    .name {
        flex: 1;
        &:empty::before {
            content: 'Anonymous';
            font-style: italic;
            opacity: .75;
        }
    }
    .action {
        padding-left: 15px;
        opacity: 0;
        color: #0ebcea;
        font-weight: bold;
        cursor: pointer;
        font-size: 70%;

        &:hover {
            opacity: 1;
        }
    }
    .score {
        width: 75px;
        text-align: right;
    }

    .button {
        display: block;
        border: 0;
        float: right;
        cursor: pointer;
        color: #FFF;
        padding: .1em .4em;
    }

    .btn-playagain {
        background-color: #999;
        font-size: 200%;
        &:hover {
            background-color: #666;
        }
    }
</style>
