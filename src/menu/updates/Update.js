import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../Firebase';
import './Update.css';

const Update = () => {
  const [updates, setUpdates] = useState([]);
  const [error, setError] = useState('');
  const [expandedUpdates, setExpandedUpdates] = useState({});

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const updatesCollection = collection(db, 'updates');
        const updatesSnapshot = await getDocs(updatesCollection);
        const updatesList = updatesSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: data.date?.toDate ? data.date.toDate() : new Date(),
          };
        });

        updatesList.sort((a, b) => new Date(b.date) - new Date(a.date));
        setUpdates(updatesList);
        
        const initialExpandedState = {};
        updatesList.forEach(update => {
          initialExpandedState[update.id] = false;
        });
        setExpandedUpdates(initialExpandedState);
      } catch (err) {
        console.error('Error fetching updates:', err);
        setError('Failed to fetch updates. Please try again later.');
      }
    };

    fetchUpdates();
  }, []);

  const toggleExpand = (id) => {
    setExpandedUpdates(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const needsReadMore = (text) => {
    return text.length > 60;
  };

  return (
    <div className="Updates">
      <div className="update-container">
        <h1>Updates</h1>
        {error && <p className="error">{error}</p>}
        {updates.length > 0 ? (
          updates.map((update) => (
            <div key={update.id} className="UpdateItem">
              <div className="UpdateText-container">
                <div 
                  className={`UpdateText ${
                    needsReadMore(update.text) && !expandedUpdates[update.id] 
                      ? 'collapsed' 
                      : 'expanded'
                  }`}
                >
                  {update.text}
                </div>
              </div>
              {needsReadMore(update.text) && (
                <button 
                  className={`read-more-btn ${
                    expandedUpdates[update.id] ? 'expanded' : ''
                  }`}
                  onClick={() => toggleExpand(update.id)}
                >
                  {expandedUpdates[update.id] ? 'Show Less' : 'Show More'}
                  <span className="icon">▼</span>
                </button>
              )}
              <p className="UpdateDate">{update.date.toLocaleDateString()}</p>
            </div>
          ))
        ) : (
          !error && <p className="empty-state">No updates available.</p>
        )}
      </div>
      <div className="version-watermark">ACQUIRE v1.1.0</div>
    </div>
  );
};

export default Update;