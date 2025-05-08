import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "../../Firebase";
import "./Leaderboard.css";
import images from '../dashboard/imageUtils';


const Leaderboard = () => {
  const [players, setPlayers] = useState([]);
  const [authPlayerRank, setAuthPlayerRank] = useState(null);
  const [authPlayer, setAuthPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const playersCollection = collection(db, "players");
        const snapshot = await getDocs(playersCollection);
        const playersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const filteredPlayers = playersData.filter((player) => player.gamesPlayed > 0);


        // Enhanced ranking algorithm
        const sortedPlayers = filteredPlayers.sort((a, b) => {
          // Calculate score based on multiple factors
          const calculateScore = (player) => {
            const winScore = (player.gamesWon || 0) * 100;
            const levelScore = (player.level || 0) * 10;
            const xpScore = (player.xp || 0) * 0.1;
            const streakBonus = (player.currentStreak || 0) * 5;
            return winScore + levelScore + xpScore + streakBonus;
          };

          return calculateScore(b) - calculateScore(a);
        });

        setPlayers(sortedPlayers);

        // Find authenticated player
        const user = auth.currentUser;
        if (user) {
          const authPlayerIndex = sortedPlayers.findIndex(
            (player) => player.id === user.email
          );
          if (authPlayerIndex !== -1) {
            setAuthPlayerRank(authPlayerIndex + 1);
            setAuthPlayer(sortedPlayers[authPlayerIndex]);
          }
        }
      } catch (error) {
        console.error("Error fetching players:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  // Medal emojis for top 3 players
  const getMedal = (index) => {
    switch (index) {
      case 0: return "🥇";
      case 1: return "🥈";
      case 2: return "🥉";
      default: return `${index + 1}.`;
    }
  };

  if (loading) {
    return <div className="leaderboard-loading">Loading leaderboard...</div>;
  }


  return (
    <div className="leaderboard-page">
      <div className="leaderboard-page-header">
        <h1 className="leaderboard-page-title">GLOBAL LEADERBOARD</h1>
      </div>

      <div className="leaderboard-page-content">
        <div className="leaderboard-top-players">
          <h2>TOP 10 PLAYERS</h2>
          <div className="leaderboard-player-list">
            {players
              .filter((player) => player.id && !player.id.startsWith("bot"))
              .slice(0, 10)
              .map((player, index) => (
                <div key={player.id} className={`leaderboard-player-card ${index < 3 ? "leaderboard-top-three" : ""}`}>
                  <div className="leaderboard-player-rank">
                    <span className="leaderboard-medal">{getMedal(index)}</span>
                  </div>
                  <div className="leaderboard-player-avatar">
                    {player.profilePic ? (
                      <img src={images[player.profilePic]} alt={player.name} />
                    ) : (
                      <div className="leaderboard-avatar-placeholder">{player.name.charAt(0)}</div>
                    )}
                  </div>
                  <div className="leaderboard-player-info">
                    <div className="leaderboard-player-name">{player.name}</div>
                    <div className="leaderboard-player-stats">
                      <span className="leaderboard-stat wins">🏆 {player.gamesWon || 0}</span>
                      <span className="leaderboard-stat level">⬆️ Lvl {player.level || 1}</span>
                      <span className="leaderboard-stat xp">⚡ {player.xp || 0} XP</span>
                      {player.currentStreak > 0 && (
                        <span className="leaderboard-stat streak">🔥 {player.currentStreak}</span>
                      )}
                    </div>
                  </div>
                  <div className="leaderboard-player-score">
                    <div className="leaderboard-score-value">
                      {Math.round(
                        ((player.gamesWon || 0) * 100 + 
                        (player.level || 0) * 10 + 
                        (player.xp || 0) * 0.1 +
                        (player.currentStreak || 0) * 5)
                      )}
                    </div>
                    <div className="leaderboard-score-label">PTS</div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {authPlayer && (
          <div className="leaderboard-current-player">
            <h2>YOUR POSITION</h2>
            <div className="leaderboard-player-card highlighted">
              <div className="leaderboard-player-rank">
                <span className="leaderboard-rank-number">#{authPlayerRank}</span>
              </div>
              <div className="leaderboard-player-avatar">
                {authPlayer.profilePic ? (
                  <img src={images[authPlayer.profilePic]} alt={authPlayer.name} />
                ) : (
                  <div className="leaderboard-avatar-placeholder">{authPlayer.name.charAt(0)}</div>
                )}
              </div>
              <div className="leaderboard-player-info">
                <div className="leaderboard-player-name">{authPlayer.name}</div>
                <div className="leaderboard-player-stats">
                  <span className="leaderboard-stat wins">🏆 {authPlayer.gamesWon || 0}</span>
                  <span className="leaderboard-stat level">⬆️ Lvl {authPlayer.level || 1}</span>
                  <span className="leaderboard-stat xp">⚡ {authPlayer.xp || 0} XP</span>
                  {authPlayer.currentStreak > 0 && (
                    <span className="leaderboard-stat streak">🔥 {authPlayer.currentStreak}</span>
                  )}
                </div>
              </div>
              <div className="leaderboard-player-score">
                <div className="leaderboard-score-value">
                  {Math.round(
                    ((authPlayer.gamesWon || 0) * 100 + 
                    (authPlayer.level || 0) * 10 + 
                    (authPlayer.xp || 0) * 0.1 +
                    (authPlayer.currentStreak || 0) * 5)
                  )}
                </div>
                <div className="leaderboard-score-label">PTS</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;