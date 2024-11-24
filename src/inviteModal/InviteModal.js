// src/menu/InviteModal.js
import React from 'react';
import './InviteModal.css';
import { auth } from '../Firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const InviteModal = ({ isOpen, onClose, inviteEmail, setInviteEmail }) => {
  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateEmail(inviteEmail)) {
      try {
        const password = generateTemporaryPassword();
        await createUserWithEmailAndPassword(auth, inviteEmail, password);
        alert('Invite sent successfully!');
        onClose();
      } catch (error) {
        console.error('Error creating user: ', error);
        alert('Error sending invite: ' + error.message);
      }
    } else {
      alert('Please enter a valid email address.');
    }
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const generateTemporaryPassword = () => {
    // Generate a temporary password or use a predefined one
    return '123456';
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