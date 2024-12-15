import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { db , auth} from '../../Firebase'; // Update the path to the correct location
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import images from './imageUtils'; // Import the images
import ImageSelectionModal from './ImageSelectionModal';

const Dashboard = () => {
    const [playerData, setPlayerData] = useState({ name: '', level: 0, profilePic: '' });
    const [email, setEmail] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingPic, setIsEditingPic] = useState(false);
    const [newName, setNewName] = useState('');
  
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
          <div className="ProfilePicContainer">
            <img src={profilePic} alt="Profile" className="DashboardImage" />
            <button onClick={handlePicEdit}>Edit</button>
          </div>
          <div className="NameContainer">
            {isEditingName ? (
              <div>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter new name"
                />
                <button onClick={handleNameSave}>Save</button>
              </div>
            ) : (
              <div>
                <h2 className="DashboardName">{playerData.name}</h2>
                <button onClick={handleNameEdit}>Edit</button>
              </div>
            )}
          </div>
          <p className="DashboardLevel">Level: {playerData.level}</p>
          <ImageSelectionModal
            email={email}
            isOpen={isEditingPic}
            onClose={() => setIsEditingPic(false)}
            onSelect={handlePicSave}
          />
        </div>
      );
    };
  
  export default Dashboard;