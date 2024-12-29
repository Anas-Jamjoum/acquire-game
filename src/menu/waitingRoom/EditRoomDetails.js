import React, { Component } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../Firebase'; // Update the path to the correct location
import './EditRoomDetails.css'; // Import the CSS file for styling

class EditRoomDetails extends Component {
  constructor(props) {
    super(props);
    this.state = {
      gameName: props.gameData.gameName,
      host: props.gameData.host,
      isPrivate: props.gameData.isPrivate,
      mode: props.gameData.mode,
      roomDescription: props.gameData.roomDescription,
    };
  }

  handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    this.setState({
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  handleFormSubmit = async (e) => {
    e.preventDefault();
    const { gameId, onClose } = this.props;
    const gameDocRef = doc(db, 'rooms', gameId);
    await updateDoc(gameDocRef, this.state);
    onClose();
  };

  render() {
    const { gameName, host, isPrivate, mode, roomDescription } = this.state;
    const { onClose } = this.props;

    return (
      <div className="EditRoomDetailsModal">
        <div className="EditRoomDetailsContent">
          <button className="CloseButton" onClick={onClose}>×</button>
          <h1>Edit Room Details</h1>
          <form onSubmit={this.handleFormSubmit}>
            <label className="InputLabel">
              Game Name:
              <input
                type="text"
                name="gameName"
                value={gameName}
                onChange={this.handleInputChange}
                placeholder="Enter Game Name"
                maxLength={20}
              />
            </label>
            <label className="InputLabel">
              Host:
              <input
                type="text"
                name="host"
                value={host}
                onChange={this.handleInputChange}
                placeholder="Enter Host Email"
              />
            </label>
            <label className="InputLabel">
              Private:
              <input
                type="checkbox"
                name="isPrivate"
                checked={isPrivate}
                onChange={this.handleInputChange}
              />
            </label>
            <label className="InputLabel">
              Mode:
              <select name="mode" value={mode} onChange={this.handleInputChange}>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </label>
            <label className="InputLabel">
              Room Description:
              <textarea
                name="roomDescription"
                value={roomDescription}
                onChange={this.handleInputChange}
                placeholder="Enter Room Description"
                maxLength={50}
              />
            </label>
            <div className="ButtonGroup">
              <button type="submit" className="SaveButton">Save</button>
              <button type="button" onClick={onClose}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}

export default EditRoomDetails;