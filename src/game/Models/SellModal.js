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