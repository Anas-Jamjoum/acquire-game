import React, { useState, useEffect, useRef } from 'react';
import './Dashboard.css';
import { db , auth} from '../../Firebase'; // Update the path to the correct location
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import images from './imageUtils'; // Import the images
import ImageSelectionModal from './ImageSelectionModal';
import FriendList from '../../friendsManagement/FriendList'; // Import the FriendList component

const Dashboard = () => {
    const [playerData, setPlayerData] = useState({ name: '', level: 0, profilePic: '' });
    const [email, setEmail] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingPic, setIsEditingPic] = useState(false);
    const [newName, setNewName] = useState('');
    const inputRef = useRef(null); // Move useRef inside the component

    useEffect(() => {
      const fetchPlayerData = async () => {
        const user = auth.currentUser;
        if (user) {
          setEmail(user.email);
          const playerDocRef = doc(db, 'players', user.email);
          const playerDoc = await getDoc(playerDocRef);
          if (playerDoc.exists()) {
            setPlayerData(playerDoc.data());
          } else {
            console.log('No such document!');
          }
        }
      };
  
      fetchPlayerData();
    }, []);

    useEffect(() => {
        if (isEditingName && inputRef.current) {
          inputRef.current.style.width = `${newName.length + 1}ch`;
          inputRef.current.focus();
        }
      }, [isEditingName, newName]);
  
    const handleNameEdit = () => {
      setIsEditingName(true);
      setNewName(playerData.name);
    };
  
    const handleNameSave = async () => {
      const playerDocRef = doc(db, 'players', email);
      await updateDoc(playerDocRef, { name: newName });
      setPlayerData((prevData) => ({ ...prevData, name: newName }));
      setIsEditingName(false);
    };
  
    const handlePicEdit = () => {
      setIsEditingPic(true);
    };

    const handlePicSave = async () => {
      setIsEditingPic(false);
      const user = auth.currentUser;
      if (user) {
        setEmail(user.email);
        const playerDocRef = doc(db, 'players', user.email);
        const playerDoc = await getDoc(playerDocRef);
        if (playerDoc.exists()) {
          setPlayerData(playerDoc.data());
        } else {
          console.log('No such document!');
        }
      }
    };
    const profilePic = images[playerData.profilePic];

    return (
        <div className="Dashboard">
        <h1>Dashboard</h1>
        <div className="DashboardInfo">
        <div className="ProfilePicContainer">
          <img src={profilePic} alt="Profile" className="DashboardImage" />
          <button className="edit-button" onClick={handlePicEdit}>Edit</button>
        </div>
        <div className="NameContainer">
          {isEditingName ? (
            <div className="NameEditContainer">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter new name"
                ref={inputRef}
              />
              <button onClick={handleNameSave}>Save</button>
            </div>
          ) : (
            <div className="NameDisplayContainer">
              <h2 className="DashboardName">{playerData.name}</h2>
              <button onClick={handleNameEdit}>Edit</button>
            </div>
          )}
        </div>
        </div>
        <p className="DashboardLevel">Level: {playerData.level}</p>
        <ImageSelectionModal
          isOpen={isEditingPic}
          onClose={() => setIsEditingPic(false)}
          onSelect={handlePicSave}
          email={email}
          db={db}
        />
        <FriendList />
      </div>
      );
    };
  
  export default Dashboard;