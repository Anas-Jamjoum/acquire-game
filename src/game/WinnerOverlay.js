import React, { useEffect } from "react";
import images from "../menu/dashboard/imageUtils";
import winnerSound from '../Audio/winner.mp3'; // <-- Add this line

const WinnerOverlay = ({ winner, players, handleReturnHome }) => {
  useEffect(() => {
    const audio = new Audio(winnerSound);
    audio.volume = 0.25; 
    audio.play().catch(() => {});
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);


  return (
    <div className="winner-overlay">
      <div>
        <h1>Winner: {winner}</h1>
        <button onClick={handleReturnHome}>Return to Home</button>
      </div>
      <div className="sorted-players">
        <h3>Players</h3>
        {players
          .slice()
          .sort((a, b) => b.money - a.money)
          .map((player, index) => (
            <div key={index} className="playeraa">
              {player.profilePic && (
                <img
                  src={images[player.profilePic]}
                  alt={player.name}
                  className="player-imageaa"
                />
              )}
              <div className="player-detailsaa">
                <div className="player-nameaa">{player.name}</div>
                <div className="player-moneyaa">Money: ${player.money}</div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default WinnerOverlay;