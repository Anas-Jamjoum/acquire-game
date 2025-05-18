export const checkCanEnd = (selectedTile, HQS, board) => {
  const largeHQs = HQS.filter(hq => hq.tiles.length > 40);
  
  if (largeHQs.length === 0) {
    return false;
  }
  
  const row = Math.floor(selectedTile / 12);
  const col = selectedTile % 12;
  
  const directions = [
    [-1, 0], 
    [1, 0], 
    [0, -1], 
    [0, 1]  
  ];
  
  for (const [dr, dc] of directions) {
    const r = row + dr;
    const c = col + dc;
    
    if (r >= 0 && r < 9 && c >= 0 && c < 12) {
      const neighborIndex = r * 12 + c;
      const neighborColor = board && board[neighborIndex] ? board[neighborIndex].color : undefined;
      
      if (largeHQs.some(hq => hq.color === neighborColor)) {
        return true;
      }
    }
  }
  return false;
};