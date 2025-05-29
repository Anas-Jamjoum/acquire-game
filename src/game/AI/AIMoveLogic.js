import { doc, updateDoc } from "firebase/firestore";
import { checkNeighborColor, assignNewRandomTiles, getConnectedGrayTiles } from "../HelperFunctions";
import { checkCanEnd, checkForWinner } from "../GameLogic";
import { MCTSNode, cloneGameState } from "./MCTSAI";

export class AIMoveLogic {
  constructor(deps) {
    Object.assign(this, deps);
  }

  checkMaxStocksAi(hq, player) {
    let max = 0;
    if (!hq || !player || hq.stocks <= 0) return 0;
    while (player.money >= hq.price * (max + 1) && max < 3) max++;
    return max;
  }

  async handleRandomMove() {
    const curr = this.players[this.currentPlayerIndex];
    if (curr?.tiles?.length) {
      const best = this.runMCTSForTilePlacement(50);
      setTimeout(() => this.handleOptionClickRandom("finish turn", best), 0);
    } else {
      setTimeout(() => this.handleOptionClickRandom("finish turn"), 0);
    }
  }
  
  runMCTSForTilePlacement(simulations = 50) {
    const rootState = {
      players: this.players,
      HQS: this.HQS,
      board: this.board,
      playerIndex: this.currentPlayerIndex
    };
    const root = new MCTSNode({ state: cloneGameState(rootState), playerIndex: this.currentPlayerIndex });

    for (let i = 0; i < simulations; i++) {
      let node = root;
      while (!node.isTerminal() && node.isFullyExpanded()) {
        node = node.bestChild();
      }
      if (!node.isTerminal()) {
        const actions = node.untriedActions;
        const action = actions[Math.floor(Math.random() * actions.length)];
        const nextState = this.simulateAction(node.state, action, node.playerIndex);
        node = node.addChild(action, nextState);
      }
      const reward = this.simulatePlayout(node.state, node.playerIndex);
      while (node) {
        node.update(reward);
        node = node.parent;
      }
    }
    return root.children.reduce((a, b) => (a.visits > b.visits ? a : b)).action;
  }

  simulateAction(state, action, playerIndex) {
    const next = cloneGameState(state);
    next.board[action].color = "gray";
    next.players[playerIndex].tiles = next.players[playerIndex].tiles.filter(t => t !== action);
    return next;
  }

  simulatePlayout(state, playerIndex) {
    const sim = cloneGameState(state);
    let curr = playerIndex;
    for (let depth = 0; depth < 20; depth++) {
      const tiles = sim.players[curr].tiles;
      if (!tiles?.length) break;
      const a = tiles[Math.floor(Math.random() * tiles.length)];
      sim.board[a].color = "gray";
      sim.players[curr].tiles = tiles.filter(t => t !== a);
      curr = (curr + 1) % sim.players.length;
    }
    const me = sim.players[playerIndex];
    const myTiles = me.tiles.length;
    const oppTiles = sim.players.reduce((sum, p, idx) => idx === playerIndex ? 0 : sum + p.tiles.length, 0);
    return myTiles - oppTiles * 0.5;
  }

  handleOptionClickRandom = (option ,tileIndex) => {
    let checkMerge = false;
    const newBoard = [...this.board];
    const players = [...this.players];
    const curr = { ...players[this.currentPlayerIndex] };

    if (tileIndex != null) curr.tiles = curr.tiles.filter(t => t !== tileIndex);
    players[this.currentPlayerIndex] = curr;

    if (tileIndex != null) {
      const neighbors = checkNeighborColor(tileIndex, this.board);
      const connected = getConnectedGrayTiles(this.board, tileIndex);

      if (neighbors.length === 0) {
        newBoard[tileIndex].color = "gray";
        if (this.checkStartHQ(tileIndex, this.board, this.HQS) && curr.email.startsWith("bot")) {
          this.startNewHQForBot(connected.concat(tileIndex), newBoard, curr, players);
        }
      } else if (neighbors.length === 1) {
        const color = this.HQS.find(h => h.color === neighbors[0])?.color;
        if (color) {
          [...connected, tileIndex].forEach(i => newBoard[i].color = color);
          const newHQS = [...this.HQS];
          const idx = newHQS.findIndex(h => h.color === color);
          newHQS[idx].tiles = Array.from(new Set([...newHQS[idx].tiles, ...connected, tileIndex]));
          this.setHQS(this.updateHQ(newHQS));
        }
      } else {
        newBoard[tileIndex].color = "gray";
        this.setBoard(newBoard);
        checkMerge = this.handleMerge(neighbors, tileIndex);
      }
    }

    if (curr.email.startsWith("bot")) {
      const d = Math.random();
      if (d < 0.5) this.aiBotBuyStock(players, curr);
      else if (d < 0.66) this.aiBotSellStock(players, curr);
    }

    if (this.turnCounter >= 1 && tileIndex != null) {
      const newTiles = assignNewRandomTiles(1, newBoard, players);
      players[this.currentPlayerIndex].tiles.push(...newTiles);
    }

    let next = (this.currentPlayerIndex + 1) % players.length;
    let tc = next === 0 ? this.turnCounter + 1 : this.turnCounter;
    if (tc === 1) {
      players.forEach((p, i) => {
        if (p.tiles.length === 0) {
          p.tiles.push(...assignNewRandomTiles(6, newBoard, players));
        }
      });
    }

    this.setPlayers(players);
    this.setCurrentPlayerIndex(next);
    this.setTurnCounter(tc);
    this.setShowOptions(false);
    this.setStocksBoughtThisTurn(0);

    if (checkCanEnd(tileIndex, this.HQS, newBoard)) {
      checkForWinner(players, this.HQS, newBoard, true, this.gameId);
    }

    if (!checkMerge) {
      const ref = doc(this.db, "startedGames", this.gameId);
      updateDoc(ref, { board: newBoard, players, currentPlayerIndex: next, turnCounter: tc, HQS: this.HQS })
        .catch(console.error);
    }
  };

  chooseHQForBot(hqs) {
    const priority = [["Continental","Imperial"],["Festival","WorldWide","American"],["Sackson","Tower"]];
    for (const group of priority) {
      const avail = hqs.filter(h => group.includes(h.name));
      if (avail.length) return avail[Math.floor(Math.random()*avail.length)];
    }
    return hqs[0] || null;
  }

  startNewHQForBot(tiles, board, curr, players) {
    const empty = this.HQS.filter(h => h.tiles.length===0);
    const pick = this.chooseHQForBot(empty);
    if (!pick) return;
    tiles.forEach(i=>board[i].color=pick.color);
    this.setBoard(board);
    const newHQS = [...this.HQS];
    const idx = newHQS.findIndex(h=>h.name===pick.name);
    newHQS[idx].tiles=[...tiles]; newHQS[idx].stocks--;
    curr.headquarters.find(h=>h.name===pick.name).stocks++;
    players[this.currentPlayerIndex]=curr;
    this.setPlayers(players);
    this.setHQS(this.updateHQ(newHQS));
  }

  aiBotBuyStock(players, curr) {
    const can = this.HQS.filter(h=>h.stocks>0&&curr.money>=h.price&&h.tiles.length>0);
    console.log("AI can buy stocks:", can);
    if (can.length && this.stocksBoughtThisTurn<3) {
      const h = can[Math.floor(Math.random()*can.length)];
      const idxH = this.HQS.findIndex(x=>x.name===h.name);
      const pIdx = players[this.currentPlayerIndex].headquarters.findIndex(x=>x.name===h.name);
      const max = this.checkMaxStocksAi(h, curr);
      const amt = Math.floor(Math.random()*max)+1;
      curr.money-=amt*h.price;
      players[this.currentPlayerIndex].headquarters[pIdx].stocks+=amt;
      const newHQS=[...this.HQS]; newHQS[idxH].stocks-=amt;
      this.setStocksBoughtThisTurn(amt);
      this.setHQS(this.updateHQ(newHQS));
      this.setPlayers(players);
    }
  }

  aiBotSellStock(players, curr) {
    const owned = curr.headquarters.filter(h=>h.stocks>0);
    if (!owned.length) return;
    const pick = owned[Math.floor(Math.random()*owned.length)];
    const amt = Math.floor(Math.random()*pick.stocks)+1;
    const idxH = this.HQS.findIndex(h=>h.name===pick.name);
    const price = this.HQS[idxH].price;
    curr.money += amt*price;
    curr.headquarters.find(h=>h.name===pick.name).stocks -= amt;
    const newHQS=[...this.HQS]; newHQS[idxH].stocks += amt;
    this.setHQS(this.updateHQ(newHQS));
    this.setPlayers(players);
  }
}
