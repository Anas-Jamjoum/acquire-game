export const getTop2PlayersWithMostStocks = (hqName, players) => {
    return [...players]
      .sort((a, b) => {
        const aStocks = a.headquarters.find(hq => hq.name === hqName)?.stocks || 0;
        const bStocks = b.headquarters.find(hq => hq.name === hqName)?.stocks || 0;
        return bStocks - aStocks;
      })
      .slice(0, 2);
  };
  
  export const checkMergeCondition = (neighborColors, HQS) => {
    const mergingHQS = HQS.filter(hq => neighborColors.includes(hq.color));
    const hqsWithMoreThan10Tiles = mergingHQS.filter(hq => hq.tiles.length > 10);
    return hqsWithMoreThan10Tiles.length < 2;
  };
  
  export const prepareMergeData = (neighborColors, HQS) => {
    const mergingHQS = [...HQS]
      .filter(hq => neighborColors.includes(hq.color))
      .sort((a, b) => a.tiles.length - b.tiles.length);
  
    const firstTwoHQS = mergingHQS.slice(0, 2);
    const isTie = firstTwoHQS[0]?.tiles.length === firstTwoHQS[1]?.tiles.length;
  
    return {
      shouldMerge: mergingHQS.length >= 2,
      isTie,
      tieHQS: isTie ? firstTwoHQS : null,
      smallerHQ: isTie ? null : firstTwoHQS[0],
      biggerHQ: isTie ? null : firstTwoHQS[1],
    };
  };
  
  export const calculateMergeBonuses = (smallerHQ, players) => {
    const top2Players = getTop2PlayersWithMostStocks(smallerHQ.name, players);
    const bonuses = {
      first: smallerHQ.price * 10,
      second: smallerHQ.price * 5,
    };
  
    return players.map(player => {
      const isFirst = player.email === top2Players[0]?.email;
      const isSecond = player.email === top2Players[1]?.email;
      return {
        ...player,
        money: player.money + (isFirst ? bonuses.first : isSecond ? bonuses.second : 0),
      };
    });
  };
  
  export const getMergePlayerOrder = (players, smallerHQ, currentPlayerIndex) => {
    const owners = players
      .map((player, index) => ({ 
        index,
        stocks: player.headquarters.find(h => h.name === smallerHQ.name)?.stocks || 0 
      }))
      .filter(({ stocks }) => stocks > 0)
      .map(({ index }) => index);
  
    const currentPlayerPos = owners.indexOf(currentPlayerIndex);
    if (currentPlayerPos > 0) {
      return [...owners.slice(currentPlayerPos), ...owners.slice(0, currentPlayerPos)];
    }
    return owners;
  };