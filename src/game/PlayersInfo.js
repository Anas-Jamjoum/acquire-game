import { useState } from "react";

export const ManagePlayers = () => {
  const [players, setPlayers] = useState([]);

  const getPlayers = () => {
    return players;
  }

  const updatePlayers = (_players) => {
    setPlayers(_players);
  }
    return {
        getPlayers,
        updatePlayers,
  };
};
