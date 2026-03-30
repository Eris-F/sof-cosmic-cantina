import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';
import { initInput } from './input.js';
import { initAudio } from './audio.js';
import { createGame, updateGame, renderGame } from './game.js';
import { renderUI, handleHighScoreTouches } from './renderer.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

function resizeCanvas() {
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

initInput(canvas);
initAudio();

const game = createGame();
handleHighScoreTouches(canvas, game);

let lastTime = performance.now();

function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 1 / 30);
  lastTime = now;

  updateGame(game, dt);

  renderGame(ctx, game);
  renderUI(ctx, game);

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
