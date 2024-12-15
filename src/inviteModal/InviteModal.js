// src/menu/InviteModal.js
import React from 'react';
import './InviteModal.css';
import { auth, db } from '../Firebase';
import { doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword , sendPasswordResetEmail } from 'firebase/auth';

const InviteModal = ({ isOpen, onClose, inviteEmail, setInviteEmail }) => {
  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateEmail(inviteEmail)) {
      try {
        const password = generateTemporaryPassword();
        await createUserWithEmailAndPassword(auth, inviteEmail, password);
        alert('Invite sent successfully!');
        await sendPasswordResetEmail(auth, inviteEmail);
        const playerName = await generatePlayerName();
        // Create a document in the 'players' collection with the email as the document ID
        const playerDocRef = doc(db, 'players', inviteEmail);
        await setDoc(playerDocRef, {
          name: playerName,
          level: 0,
          profilePic:"pic1.png"
        });

        onClose();
      } catch (error) {
        console.error('Error creating user: ', error);
        alert('Error sending invite: ' + error.message);
      }
    } else {
      alert('Please enter a valid email address.');
    }
  };

  const generatePlayerName = () => {
    const randomNumber = Math.floor(Math.random() * 10000); // Generate a random number between 0 and 9999
    return `Player${randomNumber}`;
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const generateTemporaryPassword = () => {
    // Generate a temporary password or use a predefined one
    return 'No Password';
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Invite Someone</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter email address"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />
          <div className="button-group">
            <button type="submit">Send Invite</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteModal;