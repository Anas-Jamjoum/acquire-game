import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { createInitialBoard, sortPlayersbyTile, InitializePlayersFundsAndTiles } from "./HelperFunctions";

export const InitializeGame = async ({
  roomData,
  HQS,
  userEmail,
  gameId,
  db
}) => {
  try {
    const playersFromRoom = roomData.players || [];
    const fetchedPlayers = await Promise.all(
      playersFromRoom.map(async (p) => {
        const playerDocRef = doc(db, "players", p.email);
        const snap = await getDoc(playerDocRef);
        if (snap.exists()) {
          return {
            ...snap.data(),
            email: p.email,
            headquarters: HQS.map((hq) => ({ name: hq.name, stocks: 0 })),
            tiles: [],
          };
        }
        return null;
      })
    );

    const validPlayers = fetchedPlayers.filter(Boolean);

    if (validPlayers.length < 2) {
      console.error("Not enough players to start the game");
      return;
    }

    const newBoard = createInitialBoard();
    const playersWithTiles = InitializePlayersFundsAndTiles(validPlayers, newBoard);
    const sortPlayers = sortPlayersbyTile(playersWithTiles);

    const gameData = {
      board: newBoard,
      currentPlayerIndex: 0,
      winner: null,
      players: sortPlayers,
      isStarted: true,
      finished: false,
      HQS: HQS.map((hq) => ({
        name: hq.name,
        stocks: hq.stocks,
        price: hq.price,
        tiles: [],
        color: hq.color,
      })),
      turnCounter: 0,
      mode: roomData.mode,
      host: userEmail,
    };

    await setDoc(doc(db, "startedGames", gameId), gameData);

    console.log("Game initialized successfully:", gameData);
    await updateDoc(doc(db, "rooms", gameId), {
      isStarted: true,
    });
  } catch (err) {
    console.error("Error initializing the game:", err);
  }
};