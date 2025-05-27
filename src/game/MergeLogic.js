import { useState } from "react";
import { ManageHQS } from "./HQS";
import { getConnectedGrayTiles } from "./HelperFunctions";
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../Firebase";
import { useParams, useNavigate } from "react-router-dom";

export const ManageMergeLogic = () => {
    const getTop2PlayersWithMostStocks = (players, hqName) => {
      const filteredPlayers = players.filter((player) => {
        const stocks = player.headquarters.find((hq) => hq.name === hqName)?.stocks || 0;
          return stocks > 0;
        });
    
        const sortedPlayers = filteredPlayers.sort((a, b) => {
          const aStocks = a.headquarters.find((hq) => hq.name === hqName)?.stocks || 0;
          const bStocks = b.headquarters.find((hq) => hq.name === hqName)?.stocks || 0;
          return bStocks - aStocks;
        });
    
      return sortedPlayers.slice(0, 2);
    };

    return {
      getTop2PlayersWithMostStocks,
  };
};