import React from "react";

const StartHQModal = ({ HQS, handleHQSelection, setStartHQ }) => (
  <div className="hq-modal">
    <h3>Select an HQ to Start</h3>
    {HQS.map(
      (hq, index) =>
        hq.tiles.length === 0 && (
          <button key={index} onClick={() => handleHQSelection(hq.name)}>
            {hq.name}
          </button>
        )
    )}
    <button onClick={() => setStartHQ(false)}>Cancel</button>
  </div>
);

export default StartHQModal;