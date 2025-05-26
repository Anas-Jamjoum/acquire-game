import { db } from "../Firebase";
import { doc, updateDoc } from "firebase/firestore";
import { getAllUnusedTiles } from "./HelperFunctions";
import { ManageMergeLogic } from "./MergeLogic";
import { ManageHQS } from "./HQS";


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

export const checkForWinner = (updatedPlayers, updatedHQS,board , end, gameId) => {
  const { getBonus } = ManageHQS();
  const { getTop2PlayersWithMostStocks } = ManageMergeLogic();


    const unusedTiles = getAllUnusedTiles(board, updatedPlayers);
    const noTilesLeft = unusedTiles.length === 0;

    const allHqsOver10 = updatedHQS.every((hq) => hq.tiles.length > 10);

    if (noTilesLeft || allHqsOver10 || end) {
      updatedHQS.forEach((hq) => {
        const top2Players = getTop2PlayersWithMostStocks(updatedPlayers, hq.name);
        const [firstPlayerBonus, secondPlayerBonus] = getBonus(hq.name, updatedHQS);
        if (top2Players[0]) {
          const firstPlayerIndex = updatedPlayers.findIndex(
            (p) => p.email === top2Players[0].email
          );
          if (firstPlayerIndex !== -1) {
            updatedPlayers[firstPlayerIndex].money += firstPlayerBonus;
          }
        }
        if (top2Players[1]) {
          const secondPlayerIndex = updatedPlayers.findIndex(
            (p) => p.email === top2Players[1].email
          );
          if (secondPlayerIndex !== -1) {
            updatedPlayers[secondPlayerIndex].money += secondPlayerBonus;
          }
        }
      });

      updatedPlayers.forEach((player) => {
        player.headquarters.forEach((hq) => {
          const hqIndex = updatedHQS.findIndex((h) => h.name === hq.name);
          if (hq.stocks > 0 && hqIndex !== -1) {
            player.money += updatedHQS[hqIndex].price * hq.stocks;
          }
        });
      });

      const richestPlayer = updatedPlayers.sort((a, b) => {
        return b.money - a.money;
      })[0];

      const theWinner = richestPlayer.name;

      updatedPlayers.sort((a, b) => b.money - a.money);
      updatedPlayers.forEach((player, index) => {
          player.gamesPlayed = (player.gamesPlayed || 0) + 1;
          const rankMultiplier = updatedPlayers.length - index;
          const xpEarned = 100 * rankMultiplier;

          player.xp = (player.xp || 0) + xpEarned;
      
          if (player.xp >= player.nextLevelXp) {
            player.level = (player.level || 1) + 1;
            player.xp -= player.nextLevelXp; 
            player.nextLevelXp = (player.nextLevelXp || 1000) + 100;
          }
      
          try {
            const playerDocRef = doc(db, "players", player.email);
            updateDoc(playerDocRef, {
              gamesPlayed: player.gamesPlayed,
              xp: player.xp,
              level: player.level,
              nextLevelXp: player.nextLevelXp,
              currentStreak: 0,
            });
          } catch (err) {
            console.error(`Error updating player ${player.name}:`, err);
          }
      });

      try {
        const gameDocRefPlayers = doc(db, "players", richestPlayer.email);
        updateDoc(gameDocRefPlayers, {
          gamesWon: richestPlayer.gamesWon + 1,
          currentStreak: richestPlayer.currentStreak + 1,
        });

        const gameDocRef = doc(db, "startedGames", gameId);
        updateDoc(gameDocRef, {
          players: updatedPlayers,
          winner: theWinner,
        });

        const gameDocRefRoom = doc(db, "rooms", gameId);
        updateDoc(gameDocRefRoom, {
          status: "finished",
          winner: theWinner,
        });
      } catch (err) {
        console.error("Error updating winner in Firestore:", err);
      }
    }
  };