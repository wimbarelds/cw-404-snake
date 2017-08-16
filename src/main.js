import Vue from 'vue'
import App from './App.vue'

const vueWrapper = new Vue({
  el: '#app',
  render: h => h(App)
});

window.vm = vueWrapper.$children[0];

console.info('--- Hi! This game includes an Bot/AI challenge.');
console.info(`--- Bots for this game are ran in webworkers and sent messages with all the information they should need`);
console.info(`--- Bots can send these commands: 'UP', 'DOWN', 'LEFT', 'RIGHT' back to the game`);
console.info(`--- A bot can be loaded and activated using vm.loadBot(url)`);
console.info(`--- For more information, see: https://github.com/wimbarelds/cw-404-snake/ai-challenge.md`);
