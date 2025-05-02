import React, { useState, useEffect, useRef } from 'react';
import './Dashboard.css';
import { db, auth } from '../../Firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import images from './imageUtils';
import ImageSelectionModal from './ImageSelectionModal';
import HostGameModal from '../HostGameModal/HostGameModal'; // Import the HostGameModal component
import { handleJoinRoom } from '../gameMenu/Menu';
import InviteModal from '../../inviteModal/InviteModal';



const Dashboard = () => {
    const [playerData, setPlayerData] = useState({ 
        name: 'Player', 
        level: 1, 
        profilePic: 'default',
        xp: 0,
        nextLevelXp: 1000
    });
    const [email, setEmail] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingPic, setIsEditingPic] = useState(false);
    const [newName, setNewName] = useState('');
    const [isHostGameModalOpen, setHostGameModalOpen] = useState(false);
    const [isInviteModalOpen, setInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
  
    
    const inputRef = useRef(null);
    const navigate = useNavigate();

    // Calculate XP progress percentage
    const xpPercentage = Math.min(100, (playerData.xp / playerData.nextLevelXp) * 100);

    useEffect(() => {
        const fetchPlayerData = async () => {
            try {
                const user = auth.currentUser;
                if (user) {
                    setEmail(user.email);
                    const playerDocRef = doc(db, 'players', user.email);
                    const playerDoc = await getDoc(playerDocRef);
                    if (playerDoc.exists()) {
                        setPlayerData(prev => ({
                            ...prev,
                            ...playerDoc.data()
                        }));
                    }
                }
            } catch (error) {
                console.error('Error fetching player data:', error);
            }
        };

        fetchPlayerData();
    }, []);

    useEffect(() => {
        if (isEditingName && inputRef.current) {
            inputRef.current.style.width = `${Math.max(newName.length, 10)}ch`;
            inputRef.current.focus();
        }
    }, [isEditingName, newName]);

    const handleNameEdit = () => {
        setIsEditingName(true);
        setNewName(playerData.name);
    };

    const handleNameSave = async () => {
        try {
            const playerDocRef = doc(db, 'players', email);
            await updateDoc(playerDocRef, { name: newName });
            setPlayerData(prev => ({ ...prev, name: newName }));
            setIsEditingName(false);
        } catch (error) {
            console.error('Error updating name:', error);
        }
    };
    const handleCloseHostGameModal = () => {
      setHostGameModalOpen(false);
    };
    const handlePicEdit = () => setIsEditingPic(true);

    const handlePicSave = async () => {
        try {
            const playerDocRef = doc(db, 'players', email);
            const playerDoc = await getDoc(playerDocRef);
            if (playerDoc.exists()) {
                setPlayerData(prev => ({
                    ...prev,
                    ...playerDoc.data()
                }));
            }
            setIsEditingPic(false);
        } catch (error) {
            console.error('Error updating profile picture:', error);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const profilePic = images[playerData.profilePic] || images.default;

    const handleInvite = () => {
      setInviteModalOpen(true);
    };
  
    const handleInviteSubmit = () => {
      alert(`Invite sent to ${inviteEmail}`);
      setInviteModalOpen(false);
      setInviteEmail('');
    };

    return (
        <div className="dashboard-container">
            {/* Header with game logo and sign out */}
            <header className="dashboard-header">
                <div className="game-logo">ACQUIRE</div>
            </header>

            {/* Main player profile section */}
            <main className="dashboard-main">
                <section className="player-card">
                    <div className="profile-section">
                        <div className="avatar-container" onClick={handlePicEdit}>
                            <img src={profilePic} alt="Player Avatar" className="player-avatar" />
                            <div className="edit-overlay">EDIT</div>
                        </div>
                        
                        <div className="player-info">
                            {isEditingName ? (
                                <div className="name-edit">
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        ref={inputRef}
                                        className="name-input"
                                        maxLength={20}
                                    />
                                    <div className="edit-buttons">
                                        <button className="confirm-btn" onClick={handleNameSave}>
                                            CONFIRM
                                        </button>
                                        <button className="cancel-btn" onClick={() => setIsEditingName(false)}>
                                            CANCEL
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="name-display" onClick={handleNameEdit}>
                                    <h2 className="player-name">{playerData.name}</h2>
                                    <span className="edit-icon">✏️</span>
                                </div>
                            )}
                            
                            <div className="level-display">
                                <div className="level-badge">LEVEL {playerData.level}</div>
                                <div className="xp-bar-container">
                                    <div 
                                        className="xp-bar-fill" 
                                        style={{ width: `${xpPercentage}%` }}
                                    ></div>
                                    <span className="xp-text">
                                        {playerData.xp}/{playerData.nextLevelXp} XP
                                    </span>
                                </div>
                                <button className="sign-out-btn" onClick={handleLogout}>
                    <span className="icon-power"></span> SIGN OUT
                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Game stats section */}
                <section className="game-stats">
                    <h3 className="section-title">PLAYER STATS</h3>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-value">{playerData.gamesPlayed}</div>
                            <div className="stat-label">Games Played</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{playerData.gamesWon}</div>
                            <div className="stat-label">Wins</div>
                        </div>
                        <div className="stat-card">
                        <div className="stat-value">
                          {playerData.gamesPlayed > 0
                            ? parseInt((playerData.gamesWon / playerData.gamesPlayed) * 100, 10)
                            : 0}% 
                        </div>
                            <div className="stat-label">Win Rate</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{playerData.currentStreak}</div>
                            <div className="stat-label">Current Streak</div>
                        </div>
                    </div>
                </section>

                {/* Quick actions */}
                <section className="quick-actions">
                    <h3 className="section-title">QUICK ACTIONS</h3>
                    <div className="action-buttons">
                        <button className="action-btn new-game" onClick={() => setHostGameModalOpen(true)}>
                            NEW GAME
                        </button>
                        <button className="action-btn join-game" onClick={() => handleJoinRoom()}>
                            JOIN GAME
                        </button>
                        <button className="action-btn leaderboard">
                            LEADERBOARD
                        </button>
                        <button className="action-btn friends" onClick={handleInvite}>
                            INVITE FRIEND
                        </button>
                    </div>
                </section>
            </main>



            {/* Profile picture selection modal */}
            <ImageSelectionModal
                isOpen={isEditingPic}
                onClose={() => setIsEditingPic(false)}
                onSelect={handlePicSave}
                email={email}
                db={db}
            />
                  <HostGameModal
        isOpen={isHostGameModalOpen}
        onClose={handleCloseHostGameModal}
      />

<InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onSubmit={handleInviteSubmit}
        inviteEmail={inviteEmail}
        setInviteEmail={setInviteEmail}
      />
        </div>
    );
};

export default Dashboard;