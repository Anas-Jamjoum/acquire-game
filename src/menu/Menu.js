// src/menu/Menu.js
import React, { useState } from 'react';
import './Menu.css';
import InviteModal from '../inviteModal/InviteModal';

const Menu = () => {
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const handleInvite = () => {
    setInviteModalOpen(true);
  };

  const handleInviteSubmit = () => {
    alert(`Invite sent to ${inviteEmail}`);
    setInviteModalOpen(false);
    setInviteEmail('');
  };

  const handleCloseModal = () => {
    setInviteModalOpen(false);
    setInviteEmail('');
  };

  const handleGameRules = () => {
    window.open('https://renegadegamestudios.com/content/File%20Storage%20for%20site/Rulebooks/Acquire/Acquire_RGS_Rulebook_WEB.pdf?srsltid=AfmBOoqi2ctbl6Htr6JlXmYOrty9IXFHV6jDY0RnQ-_k2gLCr8DhamBo', '_blank'); // Replace with the actual URL
  };

  return (
    <div className="MenuContainer">

      <div className="Menu">
      <h1>Game Menu</h1>
        <button onClick={() => alert('Host Game functionality not implemented yet.')}>Host Game</button>
        <button onClick={() => alert('Join Game functionality not implemented yet.')}>Join Game</button>
        <button onClick={handleInvite}>Invite</button>
        <button onClick={handleGameRules}>Game Rules</button>
      </div>
      <div className="GameDescription">
        <div className="GameTitle">
          <h1>Game Title</h1>
          <p>Game title will be displayed here.</p>
        </div>
      </div>
      <div className="Updates">
        <h1>Updates</h1>
        <p>Latest updates and news will be displayed here.</p>
      </div>

      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleInviteSubmit}
        inviteEmail={inviteEmail}
        setInviteEmail={setInviteEmail}
      />
    </div>
  );
};

export default Menu;