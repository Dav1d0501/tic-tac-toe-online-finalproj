import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import io from 'socket.io-client';
import HomePage from './Pages/HomePage';
import GamePage from './Pages/GamePage';
import AuthPage from './Pages/AuthPage';
import Lobby from './Pages/Lobby'; 
import './App.css';

// Socket Connection Configuration
// Selects the production URL from environment variables or defaults to localhost for development
const SOCKET_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

// Initialize socket outside the component to prevent multiple connections during re-renders
const socket = io.connect(SOCKET_URL);

// Security Component: Restricts access to authenticated users only
const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem('user');
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

function App() {
  
  // Log connection status for debugging purposes
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server with ID:", socket.id);
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