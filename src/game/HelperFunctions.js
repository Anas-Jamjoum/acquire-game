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