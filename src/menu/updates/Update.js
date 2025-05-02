import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../Firebase'; 
import './Update.css'; 

const Update = () => {
  const [updates, setUpdates] = useState([]);
  const [error, setError] = useState(''); 

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const updatesCollection = collection(db, 'updates');
        const updatesSnapshot = await getDocs(updatesCollection);
        const updatesList = updatesSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            date: data.date?.toDate ? data.date.toDate() : new Date(), 
          };
        });

        updatesList.sort((a, b) => new Date(b.date) - new Date(a.date));

        setUpdates(updatesList);
      } catch (err) {
        console.error('Error fetching updates:', err);
        setError('Failed to fetch updates. Please try again later.');
      }
    };

    fetchUpdates();
  }, []);

  return (
    <div className="Updates">
      <h1>Updates</h1>
      {error && <p className="error">{error}</p>}
      {updates.length > 0 ? (
        updates.map((update, index) => (
          <div key={index} className="UpdateItem">
            <p className="UpdateText">{update.text}</p>
            <p className="UpdateDate">{update.date.toLocaleDateString()}</p>
          </div>
        ))
      ) : (
        !error && <p>No updates available.</p>
      )}
    </div>
  );
};

export default Update;