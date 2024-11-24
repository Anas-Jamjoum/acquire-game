import React from 'react';
import './Menu.css';

const Menu = () => {
  const handleInvite = () => {
    alert('Invite functionality not implemented yet.');
  };

  const handleHostGame = () => {
    alert('Host Game functionality not implemented yet.');
  };

  const handleJoinGame = () => {
    alert('Join Game functionality not implemented yet.');
  };

  return (
    <div className="Menu">
      <h1>Game Menu</h1>
      <button onClick={handleInvite}>Invite</button>
      <button onClick={handleHostGame}>Host Game</button>
      <button onClick={handleJoinGame}>Join Game</button>
    </div>
  );
};

export default Menu;