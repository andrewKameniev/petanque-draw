import { createApp } from 'vue';
import App from './App.vue';
import '../../src/assets/css/variables.css';

const messages = {
  'timer.timeLimitEnded': 'Time limit ended',
  'timer.resume': 'Resume timer',
  'timer.pause': 'Pause timer',
  'timer.reset': 'Reset timer',
  'timer.restart': 'Restart timer',
  'timer.restartMinutes': 'Custom minutes',
  'timer.startCustom': 'Start custom timer',
  'timer.min': 'min',
  'timer.lastCochonette': 'cochonette',
  'timer.lastCochonettes': 'cochonettes',
  'timer.playLastCochonette': 'Play the final',
  'timer.startTimer': 'Start timer',
  'tir.carreau': 'Carreau',
  'tir.reussi': 'Success',
  'tir.touche': 'Hit',
  'tir.manque': 'Miss',
};

const app = createApp(App);
app.config.globalProperties.$t = (key) => messages[key] ?? key;
app.mount('#app');
