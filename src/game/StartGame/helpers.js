export const getLabel = (row, col) => {
    const letters = 'ABCDEFGHI';
    return `${col + 1}${letters[row]}`;
  };
  
  export const shufflePlayers = (players) => {
    return [...players].sort(() => Math.random() - 0.5);
  };
  
  export const createInitialBoard = () => {
    return Array(108).fill().map((_, index) => ({
      label: getLabel(Math.floor(index / 12), index % 12),
      color: 'white',
      used: false,
    }));
  };
  
  export const assignInitialTiles = (players, boardToUpdate) => {
    const updatedBoard = [...boardToUpdate];
    players.forEach((player) => {
      player.money = 6000;
      if (!player.tiles || player.tiles.length === 0) {
        let tile;
        do {
          tile = Math.floor(Math.random() * 108);
        } while (updatedBoard[tile].used);
        updatedBoard[tile].used = true;
        player.tiles = [tile];
      }
    });
    return updatedBoard;
  };
  
  export const sortPlayersByTile = (players) => {
    return [...players].sort((a, b) => a.tiles[0] - b.tiles[0]);
  };
  
  export const getAllUnusedTiles = (board, players) => {
    const playerTiles = new Set(players.flatMap(player => player.tiles));
    return board.filter((tile, index) => (
      tile.color === 'white' && !playerTiles.has(index)
    ));
  };
  
  export const assignNewRandomTiles = (count, board, players) => {
    const unusedTiles = getAllUnusedTiles(board, players);
    const newTiles = [];
    
    for (let i = 0; i < Math.min(count, unusedTiles.length); i++) {
      const randomIndex = Math.floor(Math.random() * unusedTiles.length);
      const selectedTile = unusedTiles[randomIndex];
      const tileIndex = board.indexOf(selectedTile);
      newTiles.push(tileIndex);
      unusedTiles.splice(randomIndex, 1);
      board[tileIndex].used = true;
    }
    
    return newTiles;
  };
  
  export const getCurrentPlayer = (players, currentPlayerIndex) => {
    return players[currentPlayerIndex] || null;
  };