import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useMatchStore } from '../store/matchStore';
import { Video, Shield, Settings, LogOut } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuthStore();
  const { onlineCount } = useMatchStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full glass border-b border-white/5 px-6 py-4 flex justify-between items-center transition-all duration-300">
      <Link to="/" className="flex items-center gap-2 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent to-[#d946ef] flex items-center justify-center shadow-lg shadow-accent/25 group-hover:scale-105 transition-transform duration-300">
          <Video className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-white via-gray-200 to-accent bg-clip-text text-transparent tracking-wide">
          EchoTalk
        </span>
      </Link>

      {/* Online Users Badge */}
      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-300">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 pulse-dot"></span>
        <span>{onlineCount.toLocaleString()} online now</span>
      </div>

      {/* Nav Actions */}
      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <>
            <Link 
              to="/chat" 
              className={`p-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 text-sm font-medium ${
                isActive('/chat') 
                  ? 'bg-accent/20 text-accent border border-accent/30' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
              title="Start Video Chat"
            >
              <Video className="w-4.5 h-4.5" />
              <span className="hidden md:inline">Chat</span>
            </Link>

            {user?.role === 'ADMIN' && (
              <Link 
                to="/admin" 
                className={`p-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 text-sm font-medium ${
                  isActive('/admin') 
                    ? 'bg-accent/20 text-accent border border-accent/30' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
                title="Admin Dashboard"
              >
                <Shield className="w-4.5 h-4.5" />
                <span className="hidden md:inline">Admin</span>
              </Link>
            )}

            <Link 
              to="/settings" 
              className={`p-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 text-sm font-medium ${
                isActive('/settings') 
                  ? 'bg-accent/20 text-accent border border-accent/30' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
              title="Profile Settings"
            >
              <Settings className="w-4.5 h-4.5" />
              <span className="hidden md:inline">Settings</span>
            </Link>

            <div className="h-6 w-[1px] bg-white/10 mx-1"></div>

            <div className="flex items-center gap-2.5">
              <div className="flex flex-col text-right hidden sm:block">
                <span className="text-xs font-semibold text-white block">
                  {user?.username}
                </span>
                <span className="text-[10px] text-gray-400 block uppercase tracking-wider">
                  {user?.role}
                </span>
              </div>
              
              <button 
                onClick={handleLogout}
                className="p-2.5 rounded-xl text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all duration-200"
                title="Logout"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          </>
        ) : (
          <>
            <Link 
              to="/guest-join" 
              className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] cursor-pointer flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 0 24px rgba(124,58,237,0.3), 0 4px 12px rgba(0,0,0,0.3)' }}
            >
              <Video className="w-4 h-4" />
              Join Chat
            </Link>

            <Link 
              to="/login" 
              className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              Log in
            </Link>
            
            <Link 
              to="/register" 
              className="px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 text-gray-300 hover:text-white cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};
