import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, Search, FileText, LogOut, ChevronRight, UserCircle } from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [recapOpen, setRecapOpen] = useState(true);

  // Material 3 Navigation Item (Pill shaped)
  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center mx-3 my-1 px-4 py-3 text-sm font-medium rounded-full transition-all duration-200 ripple-dark ${
      isActive
        ? 'bg-[#e2e2e2] text-[#1f1f1f] font-semibold'
        : 'text-[#444746] hover:bg-[#e8eaed]'
    }`;

  const subNavItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center ml-12 mr-3 my-0.5 pl-4 pr-4 py-2.5 text-sm font-medium rounded-full transition-all duration-200 ripple-dark ${
      isActive
        ? 'bg-[#e2e2e2] text-[#1f1f1f] font-semibold'
        : 'text-[#444746] hover:bg-[#e8eaed]'
    }`;

  return (
    <aside className="w-64 bg-[#f8f9fa] border-r border-gray-200/60 flex flex-col h-full flex-shrink-0 z-20 print:hidden transition-colors">
      <div className="h-16 flex items-center px-6 shrink-0 mt-2 mb-2">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="RABP Logo" className="w-8 h-8 object-contain drop-shadow-sm" />
          <h1 className="font-medium text-xl tracking-tight text-[#1f1f1f]">RABP System</h1>
        </div>
      </div>

      <div className="px-5 py-3 shrink-0 mb-4">
        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-gray-200/60 shadow-sm">
          <UserCircle className="w-8 h-8 text-[#0b57d0]" />
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-[#1f1f1f] truncate w-32">{user?.username}</span>
            <span className="text-[10px] font-medium text-[#444746] mt-0.5">
              {user?.role === 'admin' ? 'Admin Access' : 'Viewer Access'}
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto flex flex-col space-y-0 custom-scrollbar">
        <NavLink to="/" className={navItemClass} end>
          <Home className="w-[22px] h-[22px] mr-4 shrink-0" strokeWidth={2} />
          <span>Input Data</span>
        </NavLink>

        <NavLink to="/search" className={navItemClass}>
          <Search className="w-[22px] h-[22px] mr-4 shrink-0" strokeWidth={2} />
          <span>Pencarian</span>
        </NavLink>

        <div className="mt-1">
          <button
            onClick={() => setRecapOpen(!recapOpen)}
            className="w-[calc(100%-24px)] mx-3 my-1 flex items-center justify-between px-4 py-3 text-sm font-medium text-[#444746] hover:bg-[#e8eaed] rounded-full transition-all duration-200 ripple-dark"
          >
            <div className="flex items-center">
              <FileText className="w-[22px] h-[22px] mr-4 shrink-0" strokeWidth={2} />
              <span>Rekapitulasi</span>
            </div>
            <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${recapOpen ? 'rotate-90' : ''}`} />
          </button>
          
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${recapOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
            <NavLink to="/recap/antar-berkas" className={subNavItemClass}>
              Antar Berkas
            </NavLink>
            <NavLink to="/recap/pencairan-sp2d" className={subNavItemClass}>
              Pencairan SP2D
            </NavLink>
          </div>
        </div>
      </nav>

      <div className="p-4 shrink-0 mt-auto">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-full text-sm font-medium text-white bg-[#0b57d0] hover:bg-[#0842a0] transition-all duration-200 ripple shadow-sm"
        >
          <LogOut className="w-[18px] h-[18px]" strokeWidth={2.5} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
