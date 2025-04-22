export const INITIAL_HQS = [
    { name: 'Sackson', stocks: 25, tiles: [], price: 0, color: 'red' },
    { name: 'Tower', stocks: 25, tiles: [], price: 0, color: 'yellow' },
    { name: 'American', stocks: 25, tiles: [], price: 0, color: 'darkblue' },
    { name: 'Festival', stocks: 25, tiles: [], price: 0, color: 'green' },
    { name: 'WorldWide', stocks: 25, tiles: [], price: 0, color: 'purple' },
    { name: 'Continental', stocks: 25, tiles: [], price: 0, color: 'blue' },
    { name: 'Imperial', stocks: 25, tiles: [], price: 0, color: 'orange' },
  ];
  
  export const updateHQPrice = (hq, tilesLength) => {
    const priceMap = {
      Sackson: [200, 300, 400, 500, 600, 700, 800, 900, 1000],
      Tower: [200, 300, 400, 500, 600, 700, 800, 900, 1000],
      American: [300, 400, 500, 600, 700, 800, 900, 1000, 1100],
      Festival: [300, 400, 500, 600, 700, 800, 900, 1000, 1100],
      WorldWide: [300, 400, 500, 600, 700, 800, 900, 1000, 1100],
      Continental: [400, 500, 600, 700, 800, 900, 1000, 1100, 1200],
      Imperial: [400, 500, 600, 700, 800, 900, 1000, 1100, 1200],
    };
  
    const thresholds = [2, 3, 4, 5, 10, 20, 30, 40, 41];
    const index = thresholds.findIndex(threshold => tilesLength < threshold);
    return priceMap[hq.name][index === -1 ? 8 : index];
  };
  
  export const checkCanEndGame = (HQS) => HQS.some(hq => hq.tiles.length > 40);
  
  export const checkStartHQ = (selectedTile, board, HQS) => {
    const row = Math.floor(selectedTile / 12);
    const col = selectedTile % 12;
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  
    return directions.some(([dr, dc]) => {
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < 9 && c >= 0 && c < 12) {
        const neighborIndex = r * 12 + c;
        return (
          board[neighborIndex].color === 'gray' && 
          checkNeighborColor(neighborIndex, board).length === 0 && 
          HQS.some(hq => hq.tiles.length === 0)
        );
      }
      return false;
    });
  };
  
  export const updateHQ = (HQS, hqName, connectedTiles) => {
    return HQS.map(hq => {
      if (hq.name === hqName) {
        const updatedTiles = [...new Set([...hq.tiles, ...connectedTiles])];
        return {
          ...hq,
          tiles: updatedTiles,
          price: updateHQPrice(hq, updatedTiles.length),
          stocks: hq.stocks - 1,
        };
      }
      return hq;
    });
  };