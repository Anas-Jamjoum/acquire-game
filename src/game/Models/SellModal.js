import React from "react";

const SellModal = ({
  HQS,
  players,
  currentPlayerIndex,
  selectedHQToSell,
  setSelectedHQToSell,
  sellAmount,
  setSellAmount,
  sellError,
  handleSellStock,
  setShowSellModal
}) => (
  <div className="sell-modal">
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
      onClick={() => setShowSellModal(false)}
      aria-label="Close"
    >
      ×
    </button>
    <h3>Sell Stocks</h3>
    <select
      onChange={(e) => setSelectedHQToSell(e.target.value)}
      value={selectedHQToSell || ""}
    >
      <option value="">Select HQ</option>
      {HQS.filter((hq) =>
        players[currentPlayerIndex]?.headquarters.some(
          playerHQ => playerHQ.name === hq.name && playerHQ.stocks > 0
        )
      ).map((hq, index) => (
        <option key={index} value={hq.name}>
          {hq.name} - ${hq.price} per stock
        </option>
      ))}
    </select>
    <input
      type="number"
      min="1"
      value={sellAmount}
      onChange={(e) => setSellAmount(parseInt(e.target.value))}
      placeholder="Amount"
    />
    {sellError && <div className="error-message">{sellError}</div>}
    <button onClick={handleSellStock}>Sell</button>
    <button onClick={() => setShowSellModal(false)}>Cancel</button>
  </div>
);

export default SellModal;