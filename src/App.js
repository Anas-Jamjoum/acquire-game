import './App.css';
import Login from './authentication/login/Login';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Menu from './menu/gameMenu/Menu';
import ProtectedRoute from './authentication/services/ProtectedRoute';
import { AuthProvider } from './authentication/services/AuthContext';
import WaitingRoom from './menu/waitingRoom/WaitingRoom';
import StartGame from './game/StartGame'; // Import the new StartGame component

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/" element={<Login />} />
          
          {/* Protected Routes */}
          <Route
            path="/menu"
            element={
              <ProtectedRoute>
                <Menu />
              </ProtectedRoute>
            }
          />
          <Route
            path="/waiting-room/:gameId"
            element={
              <ProtectedRoute>
                <WaitingRoom />
              </ProtectedRoute>
            }
          />
          <Route
            path="/start-game/:gameId"
            element={
              <ProtectedRoute>
                <StartGame />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;