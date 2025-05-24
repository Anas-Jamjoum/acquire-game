import React from "react";
import images from "../menu/dashboard/imageUtils";


const PlayersInfoPanel = ({
  winner,
  players,
  userEmail,
  HQS,
  renderTileButton,
  showAllPlayers,
}) => (
  <div className="players-info">
    {showAllPlayers ? (
      <div className="players-info-show-all">
        {winner === null &&
          players
            .slice()
            .sort((a, b) =>
              a.email === userEmail ? -1 : b.email === userEmail ? 1 : 0
            )
            .map((player, index) => (
              <div key={index} className="player">
                {player.profilePic && (
                  <img
                    src={images[player.profilePic]}
                    alt={player.name}
                    className="player-image"
                  />
                )}
                <div className="player-name">
                  {player.email.startsWith("bot")
                    ? `${player.name} (Bot)`
                    : player.name}
                </div>
                <div className="player-money">Money: ${player.money}</div>
                <div className="player-level">Level: {player.level}</div>
                <div className="player-headquarters">
                  {player.headquarters?.map((hq, hqIndex) => {
                    const hqColor =
                      HQS.find((h) => h.name === hq.name)?.color || "black";
                    return (
                      <div key={hqIndex} className="hq-stock">
                        <span style={{ color: hqColor }}>■</span> {hq.name}:{" "}
                        {hq.stocks} stocks
                      </div>
                    );
                  })}
                </div>
                {player.email === userEmail && (
                  <div className="player-tiles">
                    <h4>Your Tiles:</h4>
                    {player.tiles?.map((tileIndex) =>
                      renderTileButton(tileIndex)
                    )}
                  </div>
                )}
              </div>
            ))}
      </div>
    ) : (
      <div className="players-info-show-only-me">
        {winner === null &&
          players
            .filter((player) => player.email === userEmail)
            .map((player, index) => (
              <div key={index} className="player">
                {player.profilePic && (
                  <img
                    src={images[player.profilePic]}
                    alt={player.name}
                    className="player-image"
                  />
                )}
                <div className="player-name">{player.name}</div>
                <div className="player-money">Money: ${player.money}</div>
                <div className="player-level">Level: {player.level}</div>
                <div className="player-headquarters">
                  {player.headquarters?.map((hq, hqIndex) => {
                    const hqColor =
                      HQS.find((h) => h.name === hq.name)?.color || "black";
                    return (
                      <div key={hqIndex} className="hq-stock">
                        <span style={{ color: hqColor }}>■</span> {hq.name}:{" "}
                        {hq.stocks} stocks
                      </div>
                    );
                  })}
                </div>
                <div className="player-tiles">
                  <h4>Your Tiles:</h4>
                  {player.tiles?.map((tileIndex) =>
                    renderTileButton(tileIndex)
                  )}
                </div>
              </div>
            ))}
        <div className="hqs-info">
          <h3>Headquarters Stocks</h3>
          {HQS.map((hq, index) => (
            <div key={index} className="hq-stock">
              <span style={{ color: hq.color }}>■</span> {hq.name}:{hq.stocks}{" "}
              stocks, ${hq.price} each, {hq.tiles.length} tiles
            </div>
          ))}
        </div>
      </div>
    )}
    {showAllPlayers && winner === null && (
      <div className="hqs-info">
        <h3>Headquarters Stocks</h3>
        {HQS.map((hq, index) => (
          <div key={index} className="hq-stock">
            <span style={{ color: hq.color }}>■</span> {hq.name}:{hq.stocks}{" "}
            stocks, ${hq.price} each, {hq.tiles.length} tiles
          </div>
        ))}
      </div>
    )}
  </div>
);

export default PlayersInfoPanel;