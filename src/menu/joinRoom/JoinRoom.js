import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../Firebase'; // Update the path to the correct location
import { collection, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import './JoinRoom.css'; // Import the CSS file for styling

const JoinRoom = () => {
  const [rooms, setRooms] = useState([]);
  const [password, setPassword] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [error, setError] = useState('');
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const roomsPerPage = 4; // Number of rooms to display per page
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRooms = async () => {
      const roomsCollection = collection(db, 'rooms');
      const roomsSnapshot = await getDocs(roomsCollection);
      const roomsList = roomsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      roomsList.sort((a, b) => a.gameName.localeCompare(b.gameName));
      setRooms(roomsList);
    };

    fetchRooms();
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
        const roomDocRef = doc(db, 'rooms', room.id);
        await updateDoc(roomDocRef, {
          players: arrayUnion(user.email)
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

  const filteredRooms = rooms.filter(room =>
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

  return (
    <div className="JoinRoom">
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
                  {room.players.length >= room.maxPlayers ? 'Full' : room.isStarted ? 'Started' : 'Waiting'}
                </div>
              </div>
              <button className="JoinRoomButton" onClick={() => handleJoinRoom(room)}>Join Room</button>
            </div>
          ))
        )}
      </div>

      <div className="Pagination">
        <button onClick={handlePreviousPage} disabled={currentPage === 1}>Previous</button>
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={handleNextPage} disabled={currentPage === totalPages}>Next</button>
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