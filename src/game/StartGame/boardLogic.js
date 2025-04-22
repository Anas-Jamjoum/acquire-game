export const getConnectedGrayTiles = (board, selectedTile) => {
    const numRows = 9;
    const numCols = 12;
    const visited = new Set();
    const queue = [selectedTile];
  
    const indexToRowCol = (i) => [Math.floor(i / numCols), i % numCols];
    const rowColToIndex = (r, c) => r * numCols + c;
  
    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current)) continue;
      visited.add(current);
  
      const [row, col] = indexToRowCol(current);
      const neighbors = [
        [row - 1, col], [row + 1, col],
        [row, col - 1], [row, col + 1]
      ];
  
      for (const [nr, nc] of neighbors) {
        if (nr >= 0 && nr < numRows && nc >= 0 && nc < numCols) {
          const neighborIndex = rowColToIndex(nr, nc);
          if (board[neighborIndex].color === 'gray') {
            queue.push(neighborIndex);
          }
        }
      }
    }
    return Array.from(visited);
  };
  
  export const checkNeighborColor = (tileIndex, board) => {
    const row = Math.floor(tileIndex / 12);
    const col = tileIndex % 12;
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const neighborColors = [];
  
    for (const [dr, dc] of directions) {
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < 9 && c >= 0 && c < 12) {
        const neighborIndex = r * 12 + c;
        const color = board[neighborIndex].color;
        if (color !== 'white' && color !== 'gray') {
          neighborColors.push(color);
        }
      }
    }
  
    return [...new Set(neighborColors)];
  };
  
  export const renderBoard = (board, handleTileClick) => {
    return Array(9).fill().map((_, row) => (
      <div key={row} className="board-row">
        {Array(12).fill().map((__, col) => {
          const index = row * 12 + col;
          return (
            <div
              key={index}
              className="square"
              style={{ backgroundColor: board[index].color }}
              onClick={() => handleTileClick(index)}
            >
              {board[index].label}
            </div>
          );
        })}
      </div>
    ));
  };