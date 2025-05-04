import React, { useState } from 'react';
import './Menu.css';
import InviteModal from '../../inviteModal/InviteModal';
import Dashboard from '../dashboard/Dashboard';
import Update from '../updates/Update';
import HostGameModal from '../HostGameModal/HostGameModal';
import JoinRoom from '../joinRoom/JoinRoom';
import FriendList from '../../friendsManagement/FriendList';

let setActiveView;

export const handleJoinRoom = () => {
  if (setActiveView) {
    setActiveView('join');
  }
};

const Menu = () => {
  const [activeView, setView] = useState('dashboard'); // 'dashboard', 'join', 'updates'
  setActiveView = setView;
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [isHostGameModalOpen, setHostGameModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const handleHostGame = () => {
    setHostGameModalOpen(true);
  };

  const handleInvite = () => {
    setInviteModalOpen(true);
  };

  const handleInviteSubmit = () => {
    alert(`Invite sent to ${inviteEmail}`);
    setInviteModalOpen(false);
    setInviteEmail('');
  };



  const handleGameRules = () => {
    window.open('https://renegadegamestudios.com/content/File%20Storage%20for%20site/Rulebooks/Acquire/Acquire_RGS_Rulebook_WEB.pdf', '_blank');
  };

  const handleViewDashboard = () => {
    setActiveView('dashboard');
  };

  const handleViewUpdates = () => {
    setActiveView('updates');
  };

  return (
    <div className="menu-container">
      <header className="menu-header">
        <div className="game-logo">ACQUIRE</div>
        <nav className="menu-nav">
          <button 
            className={`nav-btn ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={handleViewDashboard}
          >
            DASHBOARD
          </button>
          <button 
            className={`nav-btn ${activeView === 'join' ? 'active' : ''}`}
            onClick={handleJoinRoom}
          >
            JOIN GAME
          </button>
          <button 
            className={`nav-btn ${activeView === 'updates' ? 'active' : ''}`}
            onClick={handleViewUpdates}
          >
            UpdateS
          </button>
        </nav>
      </header>

      <main className="menu-main">
        {activeView === 'join' && (
  <div className="action-sidebar">
    <button className="action-btn host-btn" onClick={handleHostGame}>
      HOST GAME
    </button>
    <button className="action-btn invite-btn" onClick={handleInvite}>
      INVITE FRIEND
    </button>
    <button className="action-btn rules-btn" onClick={handleGameRules}>
      GAME RULES
    </button>
  </div>
)}

        {/* Content view */}
        <div className="content-view">
          {activeView === 'dashboard' && <Dashboard />}
          {activeView === 'join' && <JoinRoom />}
          {activeView === 'updates' && <Update />}
        </div>
      </main>

      {/* Update notifications */}
      

      {/* Modals */}
      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onSubmit={handleInviteSubmit}
        inviteEmail={inviteEmail}
        setInviteEmail={setInviteEmail}
      />
      
      <FriendList/>
      <HostGameModal
        isOpen={isHostGameModalOpen}
        onClose={() => setHostGameModalOpen(false)}
      />
    </div>
  );
};

export default Menu;