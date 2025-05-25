import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../Firebase';
import { Bar } from 'react-chartjs-2';
import images from "../../menu/dashboard/imageUtils";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './AIAnalysis.css';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AIAnalysis = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeChart, setActiveChart] = useState(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const playersCollection = collection(db, 'players');
        const snapshot = await getDocs(playersCollection);

        const botPlayers = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            name: doc.data().name || `AI-${doc.id.split('bot')[1]}`,
            email: doc.id,
            gamesPlayed: doc.data().gamesPlayed || 0,
            gamesWon: doc.data().gamesWon || 0,
            currentStreak: doc.data().currentStreak || 0,
            level: doc.data().level || 1,
            xp: doc.data().xp || 0,
            nextLevelXp: doc.data().nextLevelXp || 1000,
            profilePic: doc.data().profilePic || 'default'
          }))
          .filter((player) => player.id && player.id.toLowerCase().startsWith('bot'));

        setPlayers(botPlayers);
      } catch (error) {
        console.error('Error fetching players:', error);
        setError('Failed to load AI player data');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  const renderChart = () => {
    if (!activeChart) return null;

    const sortedPlayers = [...players].sort((a, b) => {
      if (activeChart === 'winRate') {
        const aRate = a.gamesPlayed > 0 ? a.gamesWon / a.gamesPlayed : 0;
        const bRate = b.gamesPlayed > 0 ? b.gamesWon / b.gamesPlayed : 0;
        return bRate - aRate;
      } else if (activeChart === 'gamesPlayed') {
        return b.gamesPlayed - a.gamesPlayed;
      } else if (activeChart === 'streaks') {
        return b.currentStreak - a.currentStreak;
      } else if (activeChart === 'levels') {
        return b.level - a.level;
      }
      return 0;
    });

    const chartData = {
      labels: sortedPlayers.map(player => player.name),
      datasets: [{
        label: activeChart === 'winRate' ? 'Win Rate (%)' : 
               activeChart === 'gamesPlayed' ? 'Games Played' :
               activeChart === 'streaks' ? 'Current Streak' :
               'Level',
        data: sortedPlayers.map(player => {
          if (activeChart === 'winRate') {
            return player.gamesPlayed > 0 ? Math.round((player.gamesWon / player.gamesPlayed) * 100) : 0;
          } else if (activeChart === 'gamesPlayed') {
            return player.gamesPlayed;
          } else if (activeChart === 'streaks') {
            return player.currentStreak;
          } else if (activeChart === 'levels') {
            return player.level;
          }
          return 0;
        }),
        backgroundColor: activeChart === 'winRate' ? 'rgba(75, 192, 192, 0.6)' :
                         activeChart === 'gamesPlayed' ? 'rgba(54, 162, 235, 0.6)' :
                         activeChart === 'streaks' ? 'rgba(255, 206, 86, 0.6)' :
                         'rgba(153, 102, 255, 0.6)',
        borderColor: activeChart === 'winRate' ? 'rgba(75, 192, 192, 1)' :
                     activeChart === 'gamesPlayed' ? 'rgba(54, 162, 235, 1)' :
                     activeChart === 'streaks' ? 'rgba(255, 206, 86, 1)' :
                     'rgba(153, 102, 255, 1)',
        borderWidth: 1
      }]
    };

    return (
      <div className="ai-overview-chart">
        <Bar
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              title: {
                display: true,
                text: activeChart === 'winRate' ? 'AI Win Rate Comparison' :
                      activeChart === 'gamesPlayed' ? 'Games Played by AI Bots' :
                      activeChart === 'streaks' ? 'Current Win Streaks' :
                      'AI Bot Levels',
                color: '#a5b4fc',
                font: {
                  family: 'Orbitron, sans-serif',
                  size: 16
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return `${context.dataset.label}: ${context.raw}` + 
                          (activeChart === 'winRate' ? '%' : '');
                  }
                },
                bodyFont: {
                  family: 'Orbitron, sans-serif'
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  color: 'rgba(0, 195, 255, 0.1)'
                },
                ticks: {
                  color: '#a5b4fc'
                }
              },
              x: {
                grid: {
                  color: 'rgba(0, 195, 255, 0.1)'
                },
                ticks: {
                  color: '#a5b4fc'
                }
              }
            }
          }}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="ai-loading-container">
        <div className="ai-spinner"></div>
        <p>Analyzing AI Performance...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-error-container">
        <p className="ai-error-message">{error}</p>
        <button className="ai-retry-btn" onClick={() => window.location.reload()}>
          RETRY
        </button>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="ai-no-data-container">
        <p>No AI players detected in the system.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="game-logo">AI ANALYSIS</div>
      </header>

              <section className="ai-bots-grid">
          {players.map((player) => {
            const xpPercentage = Math.min(100, (player.xp / player.nextLevelXp) * 100);
            
            return (
              <div key={player.id} className="player-card ai-bot-card">
                <div className="profile-section">
                  <div className="avatar-container">
                    <img 
                      src={images[player.profilePic] || images.default} 
                      alt="AI Avatar" 
                      className="player-avatar" 
                    />
                  </div>
                  
                  <div className="player-info">
                    <h2 className="player-name-dashboard">{player.name}</h2>
                    
                    <div className="level-display">
                      <div className="level-badge">LEVEL {player.level}</div>
                      <div className="xp-bar-container">
                        <div 
                          className="xp-bar-fill" 
                          style={{ width: `${xpPercentage}%` }}
                        ></div>
                        <span className="xp-text">
                          {player.xp}/{player.nextLevelXp} XP
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ai-bot-stats">
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-value">{player.gamesPlayed}</div>
                      <div className="stat-label">Games Played</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{player.gamesWon}</div>
                      <div className="stat-label">Wins</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">
                        {player.gamesPlayed > 0
                          ? parseInt((player.gamesWon / player.gamesPlayed) * 100, 10)
                          : 0}%
                      </div>
                      <div className="stat-label">Win Rate</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{player.currentStreak}</div>
                      <div className="stat-label">Current Streak</div>
                    </div>
                  </div>
                </div>

                <div className="ai-performance-tag">
                  {player.gamesPlayed > 0 && (player.gamesWon / player.gamesPlayed) > 0.7 ? (
                    <span className="ai-high-performer">HIGH PERFORMER</span>
                  ) : (
                    <span className="ai-standard">STANDARD AI</span>
                  )}
                </div>
              </div>
            );
          })}
        </section>

      <main className="dashboard-main">
        <section className="game-stats">
          <h3 className="section-title">AI BOT OVERVIEW</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{players.length}</div>
              <div className="stat-label">Total Bots</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {players.reduce((total, player) => total + player.gamesWon, 0)}
              </div>
              <div className="stat-label">Total Wins</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {players.reduce((total, player) => total + player.gamesPlayed, 0) > 0
                  ? parseInt(
                      (players.reduce((total, player) => total + player.gamesWon, 0) /
                        players.reduce((total, player) => total + player.gamesPlayed, 0)) * 100,
                      10
                    )
                  : 0}%
              </div>
              <div className="stat-label">Overall Win Rate</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {Math.max(...players.map(p => p.currentStreak))}
              </div>
              <div className="stat-label">Top Streak</div>
            </div>
          </div>
        </section>
        {renderChart()}
        <section className="quick-actions">
          <h3 className="section-title">AI PERFORMANCE METRICS</h3>
          <div className="action-buttons">
            <button 
              className={`action-btn winRate ${activeChart === 'winRate' ? 'active' : ''}`}
              onClick={() => setActiveChart(activeChart === 'winRate' ? null : 'winRate')}
            >
              WIN RATE ANALYSIS
            </button>
            <button 
              className={`action-btn gamesPlayed ${activeChart === 'gamesPlayed' ? 'active' : ''}`}
              onClick={() => setActiveChart(activeChart === 'gamesPlayed' ? null : 'gamesPlayed')}
            >
              GAMES PLAYED
            </button>
            <button 
              className={`action-btn streaks ${activeChart === 'streaks' ? 'active' : ''}`}
              onClick={() => setActiveChart(activeChart === 'streaks' ? null : 'streaks')}
            >
              WIN STREAKS
            </button>
            <button 
              className={`action-btn levels ${activeChart === 'levels' ? 'active' : ''}`}
              onClick={() => setActiveChart(activeChart === 'levels' ? null : 'levels')}
            >
              LEVEL DISTRIBUTION
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AIAnalysis;