export const getLabel = (row, col) => {
    const letters = "ABCDEFGHI";
    return `${col + 1}${letters[row]}`;
};

export const createInitialBoard = () => {
    return Array(108)
      .fill()
      .map((_, index) => ({
        label: getLabel(Math.floor(index / 12), index % 12),
        color: "black",
    }));
};

export const sortPlayersbyTile = (players) => {
    return players.sort((a, b) => a.tiles[0] - b.tiles[0]);
};

export const getAllUnusedTiles = (gameBoard, playerList) => {
    const playerTiles = new Set(playerList.flatMap((player) => player.tiles));

    const unusedTiles = gameBoard.filter((tile) => {
      const tileIndex = gameBoard.indexOf(tile);
      return ((tile.color === "black") && !playerTiles.has(tileIndex));
    });

    return unusedTiles;
};

export const assignNewRandomTiles = (numberOfTilesToAssign, gameBoard, playerList) => {
    const unusedTiles = getAllUnusedTiles(gameBoard, playerList);
    if (unusedTiles.length === 0) {
      return [];
    }

    const newTiles = [];
    for (let i = 0; i < numberOfTilesToAssign; i++) {
      if (unusedTiles.length === 0) {
        break;
      }

      const randomIndex = Math.floor(Math.random() * unusedTiles.length);
      const selectedTile = unusedTiles[randomIndex];

      selectedTile.used = true;

      const tileIndex = gameBoard.indexOf(selectedTile);
      newTiles.push(tileIndex);

      unusedTiles.splice(randomIndex, 1);
    }

    return newTiles;
};

export const InitializePlayersFundsAndTiles = (players, boardToUpdate) => {
    players.forEach((player) => {
      player.money = 6000;
      player.tiles = assignNewRandomTiles(1, boardToUpdate, players);
    });
    return players;
};

export const checkNeighborColor = (tileIndex, board) => {
    const connectedTiles = getConnectedGrayTiles(board, tileIndex);
    const numRows = 9;
    const numCols = 12;

    const neighborColors = new Set();

    const indexToRowCol = (i) => [Math.floor(i / numCols), i % numCols];
    const rowColToIndex = (r, c) => r * numCols + c;

    connectedTiles.forEach((currentTileIndex) => {
      const [row, col] = indexToRowCol(currentTileIndex);

      const directions = [
        [row - 1, col], 
        [row + 1, col], 
        [row, col - 1], 
        [row, col + 1], 
      ];

      directions.forEach(([r, c]) => {
        if (r >= 0 && r < numRows && c >= 0 && c < numCols) {
          const neighborIndex = rowColToIndex(r, c);
          const color = board[neighborIndex].color;

          if (color !== "black" && color !== "gray") {
            neighborColors.add(color);
          }
        }
      });
    });

    return Array.from(neighborColors);
  };

  export function getConnectedGrayTiles(board, tileIndex) {
    const numRows = 9;
    const numCols = 12;

    const visited = new Set();
    const queue = [tileIndex];

    const indexToRowCol = (i) => [Math.floor(i / numCols), i % numCols];
    const rowColToIndex = (r, c) => r * numCols + c;

    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current)) continue;
      visited.add(current);

      const [row, col] = indexToRowCol(current);
      const neighbors = [
        [row - 1, col],
        [row + 1, col],
        [row, col - 1],
        [row, col + 1],
      ];

      for (let [nr, nc] of neighbors) {
        if (nr >= 0 && nr < numRows && nc >= 0 && nc < numCols) {
          const neighborIndex = rowColToIndex(nr, nc);
          if (board[neighborIndex].color === "gray") {
            queue.push(neighborIndex);
          }
        }
      }
    }
    return Array.from(visited);
  }