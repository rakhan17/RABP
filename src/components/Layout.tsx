import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';

export default function Layout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-gray-100 font-sans text-gray-500">Memuat RABP System...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50 flex m-0 p-0">
      <Sidebar />
      <main className="flex-1 w-full h-full overflow-hidden relative bg-white">
        <Outlet />
      </main>
    </div>
  );
}
