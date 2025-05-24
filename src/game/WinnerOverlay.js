import React from "react";
import images from "../menu/dashboard/imageUtils";

const WinnerOverlay = ({ winner, players, handleReturnHome }) => (
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

export default WinnerOverlay;