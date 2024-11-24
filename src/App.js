import './App.css';
import Login from './authentication/login/Login';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Menu from './menu/Menu';
import ProtectedRoute from './authentication/services/ProtectedRoute';
import { AuthProvider } from './authentication/services/AuthContext';

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
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;