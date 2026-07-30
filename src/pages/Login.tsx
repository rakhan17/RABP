import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserByUsername } from '../lib/users';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const user = await getUserByUsername(username);
    if (user && user.password === password) {
      login(user);
      navigate('/');
    } else {
      setError('Username atau Password salah!');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] p-4 sm:p-6">
      <div className="bg-white p-8 sm:p-12 sm:pb-8 rounded-[28px] max-w-[448px] w-full border border-gray-200/60 shadow-sm transition-all duration-300">
        
        {/* Google-like Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <img src="/logo.svg" alt="Logo" className="w-14 h-14 object-contain drop-shadow-sm mb-4" />
          <h1 className="text-[32px] leading-[40px] font-normal text-[#1f1f1f] mb-2 tracking-tight">Login Sistem</h1>
          <p className="text-[16px] text-[#444746]">Melanjutkan ke RABP</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative">
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="peer block w-full px-4 pt-6 pb-2 text-base text-[#1f1f1f] bg-transparent border border-gray-400 rounded focus:outline-none focus:ring-0 focus:border-[#0b57d0] focus:border-2 transition-colors placeholder-transparent"
              placeholder="Username"
              required
            />
            <label 
              htmlFor="username" 
              className="absolute left-4 top-4 text-[#444746] text-base transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-[#0b57d0] peer-focus:font-medium peer-valid:top-1.5 peer-valid:text-xs bg-white px-1 -ml-1"
            >
              Username
            </label>
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="peer block w-full px-4 pt-6 pb-2 pr-10 text-base text-[#1f1f1f] bg-transparent border border-gray-400 rounded focus:outline-none focus:ring-0 focus:border-[#0b57d0] focus:border-2 transition-colors placeholder-transparent"
              placeholder="Password"
              required
            />
            <label 
              htmlFor="password" 
              className="absolute left-4 top-4 text-[#444746] text-base transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-[#0b57d0] peer-focus:font-medium peer-valid:top-1.5 peer-valid:text-xs bg-white px-1 -ml-1"
            >
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#444746] hover:text-[#1f1f1f] focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          {error && (
            <div className="text-[#d93025] text-[13px] font-medium flex items-center mt-1">
              <svg aria-hidden="true" className="w-4 h-4 fill-current mr-2" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path>
              </svg>
              {error}
            </div>
          )}

          <div className="pt-8 flex items-center justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 rounded-full text-sm font-medium text-white bg-[#0b57d0] hover:bg-[#0842a0] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0b57d0] transition-colors disabled:bg-blue-300 ripple"
            >
              {isLoading ? 'Memuat...' : 'Selanjutnya'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
