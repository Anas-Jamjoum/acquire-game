import React, { useState } from 'react';
import './Menu.css';
import InviteModal from '../../inviteModal/InviteModal';
import Dashboard from '../dashboard/Dashboard';
import Update from '../updates/Update'; // Import the Update component
import HostGameModal from '../HostGameModal/HostGameModal'; // Import the HostGameModal component
import JoinRoom from '../joinRoom/JoinRoom'; // Import the JoinRoom component

const Menu = () => {
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [isHostGameModalOpen, setHostGameModalOpen] = useState(false);
  const [isJoinRoomOpen, setJoinRoomOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const handleHostGame = () => {
    setHostGameModalOpen(!isHostGameModalOpen);
  };

  const handleInvite = () => {
    setInviteModalOpen(!isInviteModalOpen);
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

  const handleCloseHostGameModal = () => {
    setHostGameModalOpen(false);
  };

  const handleJoinRoom = () => {
    setJoinRoomOpen(!isJoinRoomOpen);
  };

  const handleGameRules = () => {
    window.open('https://renegadegamestudios.com/content/File%20Storage%20for%20site/Rulebooks/Acquire/Acquire_RGS_Rulebook_WEB.pdf?srsltid=AfmBOoqi2ctbl6Htr6JlXmYOrty9IXFHV6jDY0RnQ-_k2gLCr8DhamBo', '_blank'); // Replace with the actual URL
  };

  return (
    <div className="MenuContainer">
      <div className="Menu">
        <h1>Game Menu</h1>
        <button onClick={handleHostGame}>Host Game</button>
        <button onClick={handleJoinRoom}>Join Game</button>
        <button onClick={handleInvite}>Invite</button>
        <button onClick={handleGameRules}>Game Rules</button>
      </div>
      <div className="GameDescription">
        <div className="GameTitle">
          {!isJoinRoomOpen && <Dashboard />}
        </div>
        {isJoinRoomOpen && <JoinRoom />}
      </div>
      <Update /> {/* Use the Update component */}
      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleInviteSubmit}
        inviteEmail={inviteEmail}
        setInviteEmail={setInviteEmail}
      />
      <HostGameModal
        isOpen={isHostGameModalOpen}
        onClose={handleCloseHostGameModal}
      />
    </div>
  );
};

export default Menu;