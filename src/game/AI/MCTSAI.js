
const UCT_K = 1.41; 
export class MCTSNode {
  constructor({ state, parent = null, action = null, playerIndex }) {
    this.state = state;             
    this.parent = parent;
    this.action = action;           
    this.children = [];
    this.visits = 0;
    this.value = 0;
    this.playerIndex = playerIndex;
    this.untriedActions = this.getLegalActions();
  }

  getLegalActions() {
    const curr = this.state.players[this.playerIndex];
    return curr?.tiles ? [...curr.tiles] : [];
  }

  isFullyExpanded() {
    return this.untriedActions.length === 0;
  }

  isTerminal() {
    return this.getLegalActions().length === 0;
  }

  bestChild() {
    let best = null;
    let bestUCT = -Infinity;
    for (const child of this.children) {
      const avgValue = child.value / child.visits;
      const uct = avgValue + UCT_K * Math.sqrt(Math.log(this.visits) / child.visits);
      if (uct > bestUCT) {
        bestUCT = uct;
        best = child;
      }
    }
    return best;
  }

  addChild(action, nextState) {
    const child = new MCTSNode({
      state: nextState,
      parent: this,
      action,
      playerIndex: (this.playerIndex + 1) % nextState.players.length
    });
    this.untriedActions = this.untriedActions.filter(a => a !== action);
    this.children.push(child);
    return child;
  }

  update(value) {
    this.visits += 1;
    this.value += value;
  }
}

export function cloneGameState({ players, HQS, board, playerIndex }) {
  return {
    players: JSON.parse(JSON.stringify(players)),
    HQS: JSON.parse(JSON.stringify(HQS)),
    board: JSON.parse(JSON.stringify(board)),
    playerIndex
  };
}