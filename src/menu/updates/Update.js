import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../Firebase'; // Update the path to the correct location
import './Update.css'; // Import the CSS file for styling

const Update = () => {
  const [updates, setUpdates] = useState([]);

  useEffect(() => {
    const fetchUpdates = async () => {
      const updatesCollection = collection(db, 'updates');
      const updatesSnapshot = await getDocs(updatesCollection);
      const updatesList = updatesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          date: data.date.toDate() // Convert Firestore Timestamp to JavaScript Date
        };
      });

      // Sort updates by date, latest update first
      updatesList.sort((a, b) => new Date(b.date) - new Date(a.date));

      setUpdates(updatesList);
    };

    fetchUpdates();
  }, []);

  return (
    <div className="Updates">
      <h1>Updates</h1>
      {updates.length > 0 ? (
        updates.map((update, index) => (
          <p key={index}>{update.text}</p>
        ))
      ) : (
        <p>No updates available.</p>
      )}
    </div>
  );
};

export default Update;