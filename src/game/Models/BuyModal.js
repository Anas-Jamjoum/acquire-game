import React from "react";

const BuyModal = ({
  HQS,
  selectedHQToBuy,
  setSelectedHQToBuy,
  buyAmount,
  setBuyAmount,
  buyError,
  handleBuyStock,
  setShowBuyModal,
}) => (
  <div className="buy-modal">
    <h3>Buy Stocks</h3>
    <select
      onChange={(e) => setSelectedHQToBuy(e.target.value)}
      value={selectedHQToBuy || ""}
    >
      <option value="">Select HQ</option>
      {HQS.map(
        (hq, index) =>
          hq.tiles.length > 0 && (
            <option key={index} value={hq.name}>
              {hq.name} - ${hq.price} per stock
            </option>
          )
      )}
    </select>
    <input
      type="number"
      min="1"
      value={buyAmount}
      onChange={(e) => setBuyAmount(parseInt(e.target.value))}
      placeholder="Amount"
    />
    {buyError && <div className="error-message">{buyError}</div>}
    <button onClick={handleBuyStock}>Buy</button>
    <button onClick={() => setShowBuyModal(false)}>Cancel</button>
  </div>
);

export default BuyModal;