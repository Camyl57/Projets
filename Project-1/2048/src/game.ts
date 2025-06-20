export class Game2048 {
  size: number;
  board: number[][];

  constructor(size = 4) {
    this.size = size;
    this.board = this.createEmptyBoard();
    this.addRandomTile();
    this.addRandomTile();
  }

  createEmptyBoard(): number[][] {
    return Array.from({ length: this.size }, () => Array(this.size).fill(0));
  }

  addRandomTile(): void {
    const emptyTiles: [number, number][] = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.board[r][c] === 0) emptyTiles.push([r, c]);
      }
    }
    if (emptyTiles.length === 0) return;
    const [row, col] = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
    this.board[row][col] = Math.random() < 0.9 ? 2 : 4;
  }

  getBoard(): number[][] {
    return this.board;
  }
}
