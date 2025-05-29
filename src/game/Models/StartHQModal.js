import React from "react";

const StartHQModal = ({ HQS, handleHQSelection, setStartHQ }) => (
  <div className="hq-modal">
                <button
      className="close-modal-btn"
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        fontSize: "1.2em",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: "red",
      }}
      onClick={() => setStartHQ(false)}
      aria-label="Close"
    >
      ×
    </button>
    <h3>Select an HQ to Start</h3>
    {HQS.map(
      (hq, index) =>
        hq.tiles.length === 0 && (
          <button key={index} onClick={() => handleHQSelection(hq.name)}>
            <span style={{ color: hq.color }}>■</span> {hq.name}
          </button>
        )
    )}
    <button onClick={() => setStartHQ(false)}>Cancel</button>
  </div>
);

export default StartHQModal;