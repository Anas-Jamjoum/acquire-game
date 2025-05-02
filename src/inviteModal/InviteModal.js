import React, { useState } from 'react';
import './InviteModal.css';
import { auth, db } from '../Firebase';
import { doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';

const InviteModal = ({ isOpen, onClose, inviteEmail, setInviteEmail }) => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(inviteEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      // Save the current user's credentials
      const currentUser = auth.currentUser;
      const currentEmail = currentUser?.email;
      const currentPassword = prompt('Please enter your password to continue:'); // Prompt for the current user's password

      const password = generateTemporaryPassword();
      await createUserWithEmailAndPassword(auth, inviteEmail, password);
      await sendPasswordResetEmail(auth, inviteEmail);

      const playerName = generatePlayerName();
      const playerDocRef = doc(db, 'players', inviteEmail);
      await setDoc(playerDocRef, {
        name: playerName,
        level: 0,
        profilePic: "pic1.png",
        gamesPlayed: 0,
        gamesWon: 0,
        xp: 0,
        nextLevelXp: 1000,
        currentStreak: 0,
      });

      // Re-authenticate the original user
      if (currentEmail && currentPassword) {
        await signInWithEmailAndPassword(auth, currentEmail, currentPassword);
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error creating user: ', error);
      setError(error.message);
    }
  };

  const generatePlayerName = () => {
    const randomNumber = Math.floor(Math.random() * 10000);
    return `Player${randomNumber}`;
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const generateTemporaryPassword = () => {
    return 'No Password';
  };

  return (
    <div className="InviteModal">
      <div className="InviteModalContent">
        <button className="CloseButton" onClick={onClose}>×</button>
        
        {isSuccess ? (
          <div className="SuccessMessage">
            <h2>Invite Sent Successfully!</h2>
            <p>An invitation has been sent to {inviteEmail}</p>
          </div>
        ) : (
          <>
            <h2>Invite Player</h2>
            <form onSubmit={handleSubmit} className="InviteForm">
              <div className="InputGroup">
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="EmailInput"
                />
                {error && <p className="ErrorMessage">{error}</p>}
              </div>
              <div className="ButtonGroup">
                <button type="submit" className="SendButton">Send Invite</button>
                <button type="button" className="CancelButton" onClick={onClose}>Cancel</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default InviteModal;