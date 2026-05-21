import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { MainLayout } from './layouts/MainLayout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { GuestJoinPage } from './pages/GuestJoinPage';
import { VideoChat } from './pages/VideoChat';
import { ProfileSettings } from './pages/ProfileSettings';
import { AdminDashboard } from './pages/AdminDashboard';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

// Admin Route Guard
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  return isAuthenticated && user?.role === 'ADMIN' ? <>{children}</> : <Navigate to="/" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {/* Public Routes */}
          <Route index element={<LandingPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="guest-join" element={<GuestJoinPage />} />
          
          {/* Protected Chat workspace */}
          <Route 
            path="chat" 
            element={
              <ProtectedRoute>
                <VideoChat />
              </ProtectedRoute>
            } 
          />

          {/* Protected Settings workspace */}
          <Route 
            path="settings" 
            element={
              <ProtectedRoute>
                <ProfileSettings />
              </ProtectedRoute>
            } 
          />

          {/* Admin Dashboard */}
          <Route 
            path="admin" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
