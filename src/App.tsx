import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SearchSp2d from './pages/SearchSp2d';
import Recap from './pages/Recap';
import SavedRecaps from './pages/SavedRecaps';
import MobileBlocker from './components/MobileBlocker';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return null;
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
};


function App() {
  return (
    <MobileBlocker>
      <AuthProvider>
        <DataProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Navigate to="/input/spp" replace />} />
              <Route path="input/:type" element={<Dashboard />} />
              <Route path="search" element={<SearchSp2d />} />
              <Route path="recap/saved" element={<SavedRecaps />} />
              <Route path="recap/:type" element={<Recap />} />
              <Route path="recap" element={<Navigate to="/recap/antar-berkas" replace />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </DataProvider>
    </AuthProvider>
    </MobileBlocker>
  );
}

export default App;
