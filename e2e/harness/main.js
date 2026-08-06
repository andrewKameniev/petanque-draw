import { createApp } from 'vue';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import App from './App.vue';
import '../../src/assets/css/variables.css';

const messages = {
  'common.cancel': 'Cancel',
  'common.confirm': 'Confirm',
  'common.done': 'Done',
  'ranking.points': 'points',
  'timer.invalidData': 'Timer data is unavailable',
  'timer.invalidMinutes': 'Enter a whole number of minutes (at least 1)',
  'timer.invalidStatus': 'Timer status is unavailable',
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
  'tir.atelier': 'Atelier',
  'tir.atelier1': 'Target ball',
  'tir.atelier2': 'Target behind',
  'tir.atelier3': 'Side target',
  'tir.atelier4': 'Obstacle shot',
  'tir.atelier5': 'Cochonnet',
  'tir.back': 'Back',
  'tir.backToBracket': 'Back to bracket',
  'tir.carreau': 'Carreau',
  'tir.editTrainingSession': 'Edit training session',
  'tir.finishAtelier': 'Finish atelier',
  'tir.finishAtelierConfirm': 'Fill unanswered throws as misses and finish this atelier?',
  'tir.nextAtelier': 'Next atelier',
  'tir.nextParticipant': 'Next participant',
  'tir.prevAtelier': 'Previous atelier',
  'tir.progress': 'Training progress',
  'tir.reussi': 'Success',
  'tir.saved': 'Saved',
  'tir.touche': 'Hit',
  'tir.manque': 'Miss',
  'tir.throws': 'throws',
  'tir.totalScore': 'Total score',
  'tir.versus': 'versus',
  'training.changeDate': 'Training date',
  'training.complete': 'Complete training',
  'training.fillZeros': 'Fill unanswered as misses',
  'training.reopen': 'Reopen training',
  'training.sessionName': 'Session name',
  'training.statusCompleted': 'Completed',
  'training.statusDraft': 'Draft',
  'training.statusInProgress': 'In progress',
};

const app = createApp(App);
app.config.globalProperties.$t = (key) => messages[key] ?? key;
app.mount('#app');
