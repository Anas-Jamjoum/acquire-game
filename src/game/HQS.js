import { useState } from "react";
import { checkNeighborColor } from "./HelperFunctions";

export const ManageHQS = () => {
  const [HQS, setHQS] = useState([
    { name: "Sackson", stocks: 25, tiles: [], price: 0, color: "red" },
    { name: "Tower", stocks: 25, tiles: [], price: 0, color: "yellow" },
    { name: "American", stocks: 25, tiles: [], price: 0, color: "darkblue" },
    { name: "Festival", stocks: 25, tiles: [], price: 0, color: "green" },
    { name: "WorldWide", stocks: 25, tiles: [], price: 0, color: "purple" },
    { name: "Continental", stocks: 25, tiles: [], price: 0, color: "blue" },
    { name: "Imperial", stocks: 25, tiles: [], price: 0, color: "orange" },
  ]);

  const checkStartHQ = (tileToIndex, board) => {
    console.log(checkNeighborColor(tileToIndex, board));
    let tileIndex = tileToIndex;
    const row = Math.floor(tileIndex / 12);
    const col = tileIndex % 12;

    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];

    for (const [dr, dc] of directions) {
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < 9 && c >= 0 && c < 12) {
        const neighborIndex = r * 12 + c;
        if (
          board[neighborIndex].color === "gray" &&
          checkNeighborColor(tileToIndex, board).length === 0 &&
          HQS.some((hq) => hq.tiles.length === 0)
        ) {
          return true;
        }
      }
    }
    return false;
  };

  const updateHQPrice = (hq, tilesLength) => {
    if (hq.name === "Sackson" || hq.name === "Tower") {
      if (tilesLength === 2) {
        return 200;
      } else if (tilesLength === 3) {
        return 300;
      } else if (tilesLength === 4) {
        return 400;
      } else if (tilesLength === 5) {
        return 500;
      } else if (tilesLength >= 6 && tilesLength <= 10) {
        return 600;
      } else if (tilesLength >= 11 && tilesLength <= 20) {
        return 700;
      } else if (tilesLength >= 21 && tilesLength <= 30) {
        return 800;
      } else if (tilesLength >= 31 && tilesLength <= 40) {
        return 900;
      } else if (tilesLength >= 41) {
        return 1000;
      }
    } else if (
      hq.name === "American" ||
      hq.name === "Festival" ||
      hq.name === "WorldWide"
    ) {
      if (tilesLength === 2) {
        return 300;
      } else if (tilesLength === 3) {
        return 400;
      } else if (tilesLength === 4) {
        return 500;
      } else if (tilesLength === 5) {
        return 600;
      } else if (tilesLength >= 6 && tilesLength <= 10) {
        return 700;
      } else if (tilesLength >= 11 && tilesLength <= 20) {
        return 800;
      } else if (tilesLength >= 21 && tilesLength <= 30) {
        return 900;
      } else if (tilesLength >= 31 && tilesLength <= 40) {
        return 1000;
      } else if (tilesLength >= 41) {
        return 1100;
      }
    } else if (hq.name === "Continental" || hq.name === "Imperial") {
      if (tilesLength === 2) {
        return 400;
      } else if (tilesLength === 3) {
        return 500;
      } else if (tilesLength === 4) {
        return 600;
      } else if (tilesLength === 5) {
        return 700;
      } else if (tilesLength >= 6 && tilesLength <= 10) {
        return 800;
      } else if (tilesLength >= 11 && tilesLength <= 20) {
        return 900;
      } else if (tilesLength >= 21 && tilesLength <= 30) {
        return 1000;
      } else if (tilesLength >= 31 && tilesLength <= 40) {
        return 1100;
      } else if (tilesLength >= 41) {
        return 1200;
      }
    }
    return 0;
  };

    const getBonus = (hqName) => {
    const hqTiles = (HQS.find((hq) => hq.name === hqName)?.tiles || []).length;
    if (hqName === "Sackson" || hqName === "Tower") {
      if (hqTiles === 2) {
        return [2000, 1500];
      } else if (hqTiles === 3) {
        return [3000, 2200];
      } else if (hqTiles === 4) {
        return [4000, 3000];
      } else if (hqTiles === 5) {
        return [5000, 3700];
      } else if (hqTiles >= 6 && hqTiles <= 10) {
        return [6000, 4200];
      } else if (hqTiles >= 11 && hqTiles <= 20) {
        return [7000, 5000];
      } else if (hqTiles >= 21 && hqTiles <= 30) {
        return [8000, 5700];
      } else if (hqTiles >= 31 && hqTiles <= 40) {
        return [9000, 6200];
      } else {
        return [10000, 7000];
      }
    } else if (hqName === "American" || hqName === "Festival" || hqName === "WorldWide") {
      if (hqTiles === 2) {
        return [3000, 2200];
      } else if (hqTiles === 3) {
        return [4000, 3000];
      } else if (hqTiles === 4) {
        return [5000, 3700];
      } else if (hqTiles === 5) {
        return [6000, 4200];
      } else if (hqTiles >= 6 && hqTiles <= 10) {
        return [7000, 5000];
      } else if (hqTiles >= 11 && hqTiles <= 20) {
        return [8000, 5700];
      } else if (hqTiles >= 21 && hqTiles <= 30) {
        return [9000, 6200];
      } else if (hqTiles >= 31 && hqTiles <= 40) {
        return [10000, 7000];
      } else {
        return [11000, 7700];
      }
    } else {
      if (hqTiles === 2) {
        return [4000, 3000];
      } else if (hqTiles === 3) {
        return [5000, 3700];
      } else if (hqTiles === 4) {
        return [6000, 4200];
      } else if (hqTiles === 5) {
        return [7000, 5000];
      } else if (hqTiles >= 6 && hqTiles <= 10) {
        return [8000, 5700];
      } else if (hqTiles >= 11 && hqTiles <= 20) {
        return [9000, 6200];
      } else if (hqTiles >= 21 && hqTiles <= 30) {
        return [10000, 7000];
      } else if (hqTiles >= 31 && hqTiles <= 40) {
        return [11000, 7700];
      } else {
        return [12000, 8200];
      }
    }
  }

  const updateHQ = (hqs) => {
    const newHQS = hqs.map((hq) => ({
      ...hq,
      price: updateHQPrice(hq, hq.tiles.length),
    }));
    setHQS(newHQS);
  };

  return {
    HQS,
    checkStartHQ,
    updateHQ,
    getBonus
  };
};