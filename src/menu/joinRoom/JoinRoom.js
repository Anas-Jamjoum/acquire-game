import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../Firebase';
import { collection, doc, updateDoc, arrayUnion, onSnapshot, deleteDoc, getDocs } from 'firebase/firestore';
import './JoinRoom.css';
import FriendList from '../../friendsManagement/FriendList';


const JoinRoom = () => {
  const [rooms, setRooms] = useState([]);
  const [password, setPassword] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [error, setError] = useState('');
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const roomsPerPage = 4;
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUserEmail(user.email);
    }

    const roomsCollection = collection(db, 'rooms');
    const unsubscribe = onSnapshot(roomsCollection, (snapshot) => {
      const roomsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      roomsList.sort((a, b) => a.gameName.localeCompare(b.gameName));
      setRooms(roomsList);
      removeFinishedRooms();
    });
    return () => unsubscribe();
  }, []);

  const handleJoinRoom = (room) => {
    if (room.isPrivate) {
      setSelectedRoom(room);
      setPasswordModalOpen(true);
    } else {
      joinRoom(room);
    }
  };

  const joinRoom = async (room) => {
    const user = auth.currentUser;
    if (user) {
      try {
        const userProfile = {
          email: user.email
        };

        const roomDocRef = doc(db, 'rooms', room.id);
        await updateDoc(roomDocRef, {
          players: arrayUnion(userProfile)
        });
        navigate(`/waiting-room/${room.id}`);
      } catch (error) {
        console.error('Error joining room: ', error);
      }
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (selectedRoom && password === selectedRoom.password) {
      joinRoom(selectedRoom);
      setPasswordModalOpen(false);
      setPassword('');
      setError('');
    } else {
      setError('Incorrect password');
    }
  };

  const handleClosePasswordModal = () => {
    setPasswordModalOpen(false);
    setPassword('');
    setError('');
  };

  const filteredRooms = rooms
  .filter((room) => room.status !== "finished")
  .filter((room) =>
    room.gameName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLastRoom = currentPage * roomsPerPage;
  const indexOfFirstRoom = indexOfLastRoom - roomsPerPage;
  const currentRooms = filteredRooms.slice(indexOfFirstRoom, indexOfLastRoom);

  const totalPages = Math.ceil(filteredRooms.length / roomsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const removeFinishedRooms = () => {
    try {
      const finishedRooms = rooms.filter((room) => room.status === 'finished');
      console.log('Finished rooms:', finishedRooms)
      if (finishedRooms.length === 0) {
        return;
      }
  
      for (const room of finishedRooms) {
        const roomDocRef = doc(db, "rooms", room.id);
        deleteDoc(roomDocRef);
  
        const startedGameDocRef = doc(db, "startedGames", room.id);
        deleteDoc(startedGameDocRef);
  
      }
  
      const roomsCollection = collection(db, "rooms");
      const snapshot = getDocs(roomsCollection);
      const updatedRooms = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRooms(updatedRooms);
    } catch (error) {
      console.error("Error removing finished rooms:", error);
    }
  };

  return (
    <div className="JoinRoom">
      <FriendList /> {/* Include the FriendList component here */}
      <h1>Join a Room</h1>
      <input
        type="text"
        placeholder="Search rooms by Room Name..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="SearchInput"
      />
      <div className="RoomsList">
        <div className="RoomCard Header">
          <div className="RoomInfo">
            <div className="RoomName">Room Name</div>
            <div className="TotalPlayers">Players</div>
            <div className="GameMode">Mode</div>
            <div className="RoomPrivacy">Privacy</div>
            <div className="RoomStatus">Status</div>
          </div>
        </div>        
        {currentRooms.length === 0 ? (
          <div className="NoRoomsMessage">There are no rooms available.</div>
        ) : (
          currentRooms.map(room => (
            <div key={room.id} className="RoomCard">
              <div className="RoomInfo">
                <div className="RoomName">{room.gameName}</div>
                <div className="TotalPlayers">{room.players.length}/{room.maxPlayers}</div>
                <div className="GameMode">{room.mode}</div>
                <div className="RoomPrivacy">{room.isPrivate ? 'Private' : 'Public'}</div>
                <div className="RoomStatus">
                  {(room.players.length >= room.maxPlayers && !room.isStarted) ? 'Full' : room.isStarted ? 'Started' : 'Waiting'}
                </div>
              </div>
              <button
                className="JoinRoomButton"
                onClick={() => handleJoinRoom(room)}
                disabled={!room.players.some(player => player.email === userEmail) && (room.players.length === room.maxPlayers || room.isStarted)}
              >
                {room.players.some(player => player.email === userEmail) ? 'Rejoin Room' : 'Join Room'}
              </button>
            </div>
          ))
        )}
      </div>

      <div className="Pagination">
        <button onClick={handlePreviousPage} disabled={currentPage === 1}>Previous</button>
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={handleNextPage} disabled={currentPage >= totalPages}>Next</button>
      </div>

      {isPasswordModalOpen && (
        <div className="PasswordModal">
          <div className="PasswordModalContent">
            <h2>Enter Password</h2>
            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="submit">Submit</button>
              <button type="button" onClick={handleClosePasswordModal}>Cancel</button>
              {error && <p className="ErrorMessage">{error}</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JoinRoom;