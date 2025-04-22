import { db } from '../../Firebase';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { createInitialBoard, assignInitialTiles, sortPlayersByTile, shufflePlayers } from './helpers';
import { INITIAL_HQS } from './hqLogic';

export const initializeGame = async (gameId, roomData) => {
  try {
    const playersFromRoom = roomData.players || [];
    const fetchedPlayers = await Promise.all(
      playersFromRoom.map(async (p) => {
        const playerDocRef = doc(db, 'players', p.email);
        const snap = await getDoc(playerDocRef);
        return snap.exists() ? {
          ...snap.data(),
          email: p.email,
          headquarters: INITIAL_HQS.map(hq => ({ name: hq.name, stocks: 0 })),
          tiles: [],
        } : null;
      })
    );

    const validPlayers = fetchedPlayers.filter(Boolean);
    if (validPlayers.length < 2) {
      throw new Error('Not enough players to start the game');
    }

    const initialBoard = createInitialBoard();
    const boardWithTiles = assignInitialTiles(validPlayers, initialBoard);
    const sortedPlayers = sortPlayersByTile(shufflePlayers(validPlayers));

    const gameData = {
      board: boardWithTiles,
      currentPlayerIndex: 0,
      winner: null,
      players: sortedPlayers,
      isStarted: true,
      finished: false,
      HQS: INITIAL_HQS.map(hq => ({ ...hq })),
      turnCounter: 0,
      mode: roomData.mode,
    };

    await setDoc(doc(db, 'startedGames', gameId), gameData);
    await updateDoc(doc(db, 'rooms', gameId), { isStarted: true });

    return gameData;
  } catch (err) {
    console.error('Error initializing game:', err);
    throw err;
  }
};

export const subscribeToGame = (gameId, callback) => {
  const gameDocRef = doc(db, 'startedGames', gameId);
  return onSnapshot(gameDocRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    }
  });
};

export const updateGameState = async (gameId, updates) => {
  try {
    const gameDocRef = doc(db, 'startedGames', gameId);
    await updateDoc(gameDocRef, updates);
  } catch (err) {
    console.error('Error updating game state:', err);
    throw err;
  }
};

export const declareWinner = async (gameId, winner) => {
  try {
    const gameDocRef = doc(db, 'startedGames', gameId);
    await updateDoc(gameDocRef, { winner, finished: true });
  } catch (err) {
    console.error('Error declaring winner:', err);
    throw err;
  }
};