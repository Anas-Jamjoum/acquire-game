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

  return (
    <div className="Menu">
      <h1>Game Menu</h1>
      <button onClick={handleInvite}>Invite</button>
      <button onClick={() => alert('Host Game functionality not implemented yet.')}>Host Game</button>
      <button onClick={() => alert('Join Game functionality not implemented yet.')}>Join Game</button>

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