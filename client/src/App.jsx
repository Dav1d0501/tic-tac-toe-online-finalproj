import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import io from 'socket.io-client';
import HomePage from './Pages/HomePage';
import GamePage from './Pages/GamePage';
import AuthPage from './Pages/AuthPage';
import Lobby from './Pages/Lobby'; 
import './App.css';

// Socket Connection Configuration
const SOCKET_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

// Initialize socket
const socket = io.connect(SOCKET_URL);

// Security Component
const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem('user');
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

function App() {
  
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server with ID:", socket.id);

      // --- דיווח שהמשתמש מחובר ---
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user._id) {
          socket.emit("user_connected", user._id);
      }
      // ----------------------------------------
    });
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Protected Routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/lobby" 
          element={
            <ProtectedRoute>
              <Lobby socket={socket} />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/game/:mode" 
          element={
            <ProtectedRoute>
              <GamePage socket={socket} />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;