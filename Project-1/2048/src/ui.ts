import { Game2048 } from './game';

export function renderBoard(game: Game2048): void {
  const boardElement = document.getElementById("game-board");
  if (!boardElement) return;

  boardElement.innerHTML = "";

  for (let row = 0; row < game.size; row++) {
    for (let col = 0; col < game.size; col++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      const value = game.board[row][col];
      tile.textContent = value === 0 ? "" : value.toString();
      boardElement.appendChild(tile);
    }
  }
}
