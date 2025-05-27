import { checkNeighborColor, assignNewRandomTiles, getConnectedGrayTiles } from "./HelperFunctions";

import { doc, updateDoc } from "firebase/firestore";

export class AIMoveLogic {
  constructor({
    players,
    setPlayers,
    HQS,
    setHQS,
    board,
    setBoard,
    updateHQ,
    checkStartHQ,
    handleMerge,
    gameId,
    db,
    stocksBoughtThisTurn,
    setStocksBoughtThisTurn,
    turnCounter,
    setCurrentPlayerIndex,
    setTurnCounter,
    setShowOptions,
    currentPlayerIndex,
  }) {
    this.players = players;
    this.setPlayers = setPlayers;
    this.HQS = HQS;
    this.setHQS = setHQS;
    this.board = board;
    this.setBoard = setBoard;
    this.updateHQ = updateHQ;
    this.checkStartHQ = checkStartHQ;
    this.handleMerge = handleMerge;
    this.gameId = gameId;
    this.db = db;
    this.stocksBoughtThisTurn = stocksBoughtThisTurn;
    this.setStocksBoughtThisTurn = setStocksBoughtThisTurn;
    this.turnCounter = turnCounter;
    this.setCurrentPlayerIndex = setCurrentPlayerIndex;
    this.setTurnCounter = setTurnCounter;
    this.setShowOptions = setShowOptions;
    this.currentPlayerIndex = currentPlayerIndex;
  }

  checkMaxStocksAi(hq, player) {
    let maxStocks = 0;
    if (!hq || !player) return 0;
    if (hq.stocks <= 0) return 0;
    if (player.money >= hq.price) maxStocks++;
    if (player.money >= hq.price * 2) maxStocks++;
    if (player.money >= hq.price * 3) maxStocks++;
    return maxStocks;
  }

  handleRandomMove = () => {
    const currPlayer = this.players[this.currentPlayerIndex];
    if (!currPlayer) return;

    if (currPlayer.tiles && currPlayer.tiles.length > 0) {
      const randomTileIndex = Math.floor(
        Math.random() * currPlayer.tiles.length
      );
      const tileToPlace = currPlayer.tiles[randomTileIndex];

      setTimeout(() => {
        this.handleOptionClickRandom("finish turn", tileToPlace);
      }, 0);
    } else {
      this.handleOptionClickRandom("finish turn");
    }
  };

  handleOptionClickRandom = (option, tileIndex) => {
    let checkMerge = false;
    if (tileIndex == null) return;
    const newBoard = [...this.board];

    const updatedPlayers = [...this.players];
    const currPlayer = { ...updatedPlayers[this.currentPlayerIndex] };

    currPlayer.tiles = currPlayer.tiles.filter((t) => t !== tileIndex);
    updatedPlayers[this.currentPlayerIndex] = currPlayer;

    const connectedTiles = [...getConnectedGrayTiles(newBoard, tileIndex), tileIndex];
    const neighborColors = checkNeighborColor(tileIndex, this.board);

    if (neighborColors.length === 0) {
      newBoard[tileIndex] = {
        ...newBoard[tileIndex],
        color: "gray",
      };

      if (this.checkStartHQ(tileIndex, this.board, this.HQS) && currPlayer.email.startsWith("bot")) {
          this.startNewHQForBot(connectedTiles, newBoard, currPlayer, updatedPlayers);
        }

    } else if (neighborColors.length === 1) {
      const hqColors = this.HQS.map((hq) => hq.color);
      const selectedColor =
        hqColors.find((color) => neighborColors.includes(color)) || "gray";
      if (selectedColor !== "gray") {
        connectedTiles.forEach((index) => {
          newBoard[index] = {
            ...newBoard[index],
            color: selectedColor,
          };
        });
        const newHQS = [...this.HQS];
        const hqIndex = newHQS.findIndex((hq) => hq.color === selectedColor);
        newHQS[hqIndex].tiles = [
          ...new Set([...newHQS[hqIndex].tiles, ...connectedTiles]),
        ];
        this.setHQS(this.updateHQ(newHQS));
      }
    } else if (neighborColors.length > 1) {
      newBoard[tileIndex] = {
        ...newBoard[tileIndex],
        color: "gray",
      };
      this.setBoard(newBoard);
      checkMerge = this.handleMerge(neighborColors, tileIndex);
    }

    const decision = Math.random();
    console.log("Decision value:", decision);
    if (decision < 0.15 && currPlayer.email.startsWith("bot")) { 
        this.aiBotBuyStock(updatedPlayers, currPlayer);
    } else if (decision < 0.66 && currPlayer.email.startsWith("bot")) {
        this.aiBotSellStock(updatedPlayers, currPlayer);
    }

    if (this.turnCounter >= 1) {
      const newTiles = assignNewRandomTiles(1, newBoard, updatedPlayers);
      updatedPlayers[this.currentPlayerIndex].tiles.push(...newTiles);
    }
    this.setPlayers(updatedPlayers);

    let nextPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    const newTurnCounter =
      nextPlayerIndex === 0 ? this.turnCounter + 1 : this.turnCounter;

    if (newTurnCounter === 1) {
      for (let i = 0; i < this.players.length; i++) {
        if (updatedPlayers[i].tiles.length === 0) {
          const newTiles = assignNewRandomTiles(6, newBoard, updatedPlayers);
          updatedPlayers[i].tiles.push(...newTiles);
        }
      }
    }

    this.setPlayers(updatedPlayers);
    this.setCurrentPlayerIndex(nextPlayerIndex);
    this.setTurnCounter(newTurnCounter);
    this.setShowOptions(false);
    this.setStocksBoughtThisTurn(0);

    try {
      if (!checkMerge) {
        const gameDocRef = doc(this.db, "startedGames", this.gameId);
        updateDoc(gameDocRef, {
          board: newBoard,
          players: updatedPlayers,
          currentPlayerIndex: nextPlayerIndex,
          turnCounter: newTurnCounter,
          HQS: this.HQS,
        });
      }
    } catch (err) {
      console.error("Error updating Firestore:", err);
    }
  };


  chooseHQForBot = (hqsWithNoTiles) => {
  const priorityGroups = [
    ["Continental", "Imperial"],
    ["Festival", "WorldWide", "American"],
    ["Sackson", "Tower"],
  ];

  for (const group of priorityGroups) {
    const availableHQs = hqsWithNoTiles.filter(hq => group.includes(hq.name));
    if (availableHQs.length > 0) {
      return availableHQs[Math.floor(Math.random() * availableHQs.length)];
    }
  }
  return null;
};

startNewHQForBot = (connectedTiles, newBoard, currPlayer, updatedPlayers) => {
  const hqsWithNoTiles = this.HQS.filter((hq) => hq.tiles.length === 0);
  const chosenHQ = this.chooseHQForBot(hqsWithNoTiles);
  if (!chosenHQ) return;

  connectedTiles.forEach((index) => {
    newBoard[index] = {
      ...newBoard[index],
      color: chosenHQ.color,
    };
  });

  this.setBoard(newBoard);

  const newHQS = [...this.HQS];
  const hqIndex = newHQS.findIndex((h) => h.name === chosenHQ.name);
  newHQS[hqIndex].tiles = [
    ...new Set([...newHQS[hqIndex].tiles, ...connectedTiles]),
  ];
  newHQS[hqIndex].stocks -= 1;
  const playerHqIndex = currPlayer.headquarters.findIndex(
    (h) => h.name === chosenHQ.name
  );

  currPlayer.headquarters[playerHqIndex].stocks += 1;
  updatedPlayers[this.currentPlayerIndex] = currPlayer;
  this.setPlayers(updatedPlayers);
  this.setHQS(this.updateHQ(newHQS));
};

aiBotBuyStock = (updatedPlayers, currPlayer) => {
  const affordableHQS = this.HQS.filter(
    (hq) =>
      hq.stocks > 0 &&
      hq.price > 0 &&
      updatedPlayers[this.currentPlayerIndex].money >= hq.price
  );
  if (affordableHQS.length > 0 && this.stocksBoughtThisTurn < 3) {
    const randomHQ = affordableHQS[Math.floor(Math.random() * affordableHQS.length)];
    const hqIndex = this.HQS.findIndex((hq) => hq.name === randomHQ.name);
    const playerHQIndex = updatedPlayers[this.currentPlayerIndex].headquarters.findIndex((hq) => hq.name === randomHQ.name);
    const maxStocksCanBuy = this.checkMaxStocksAi(randomHQ, updatedPlayers[this.currentPlayerIndex]);
    const randomAmount = Math.floor(Math.random() * maxStocksCanBuy) + 1;
    this.setStocksBoughtThisTurn(randomAmount);
    const newHQS = [...this.HQS];
    newHQS[hqIndex].stocks -= randomAmount;
    updatedPlayers[this.currentPlayerIndex].headquarters[playerHQIndex].stocks += randomAmount;
    updatedPlayers[this.currentPlayerIndex].money -= randomAmount * randomHQ.price;
    this.setHQS(this.updateHQ(newHQS));
    this.setPlayers(updatedPlayers);
  }
};

aiBotSellStock = (updatedPlayers, currPlayer) => {
  const hqsWithStocks = currPlayer.headquarters.filter((hq) => hq.stocks > 0);

  if (hqsWithStocks.length > 0) {
    const randomHQIndex = Math.floor(Math.random() * hqsWithStocks.length);
    const hqToSell = hqsWithStocks[randomHQIndex];

    const randomAmountToSell = Math.floor(Math.random() * hqToSell.stocks) + 1;
    
    const hqIndex = this.HQS.findIndex((hq) => hq.name === hqToSell.name);
    const newHQS = [...this.HQS];
    newHQS[hqIndex].stocks += randomAmountToSell;

    updatedPlayers[this.currentPlayerIndex].headquarters = updatedPlayers[this.currentPlayerIndex].headquarters.map((hq) => {
      if (hq.name === hqToSell.name) {
        return {
          ...hq,
          stocks: hq.stocks - randomAmountToSell,
        };
      }
      return hq;
    });

    updatedPlayers[this.currentPlayerIndex].money += randomAmountToSell * newHQS[hqIndex].price;

    this.setHQS(this.updateHQ(newHQS));
    this.setPlayers(updatedPlayers);
  }
};
}