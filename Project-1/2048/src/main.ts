import { Game2048 } from './game';
import { renderBoard } from './ui';

const game = new Game2048();
renderBoard(game);

window.addEventListener("keydown", (e) => {
  // Add keyboard movement handling here
});
