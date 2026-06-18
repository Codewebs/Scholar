import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthButton from '../components/ui/AuthButton';
import { useAuth } from '../context/AuthContext';
import { Settings, Globe } from 'lucide-react';
import ServerConfigModal from '../components/ServerConfigModal';

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isInitialized } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      navigate('/app/dashboard', { replace: true });
    }
  }, [isAuthenticated, isInitialized, navigate]);

  if (!isInitialized) return null;

  return (
    <div className="min-h-screen bg-[#9E9E9E] flex items-center justify-center p-4 font-sans relative">
      {/* Rare Violet Accent: Server Config Trigger */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="absolute top-8 right-8 p-4 bg-white rounded-soft shadow-xl border border-gray-100 group transition-all active:scale-95"
      >
        <div className="flex items-center space-x-3">
          <Globe size={20} className="text-accent group-hover:rotate-12 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest text-black">Server IP</span>
        </div>
      </button>

      <div className="w-full max-w-[450px] bg-white p-10 rounded-[32px] shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        {/* Illustration Placeholder */}
        <div className="w-40 h-40 mb-8 flex items-center justify-center bg-gray-50 rounded-full overflow-hidden shrink-0">
          <svg viewBox="0 0 200 200" className="w-28 h-28">
            <circle cx="100" cy="180" r="80" fill="#7C3AED" opacity="0.1" />
            <path d="M60 140 Q100 120 140 140" stroke="#000" strokeWidth="4" fill="none" />
            <rect x="70" y="140" width="60" height="40" fill="#000" />
            <circle cx="70" cy="80" r="15" fill="#000" />
            <circle cx="130" cy="80" r="15" fill="#7C3AED" />
          </svg>
        </div>

        <h1 className="text-5xl font-black text-black leading-[1.1] mb-6 whitespace-pre-line tracking-tighter">
          Welcome to{"\n"}Scholar
        </h1>

        <p className="text-[10px] text-[#9E9E9E] font-black uppercase tracking-widest leading-relaxed max-w-[280px] mb-12">
          Gérez votre établissement avec une efficacité inégalée et une clarté absolue.
        </p>

        <div className="w-full space-y-4">
          <AuthButton onClick={() => navigate('/login')}>
            Login
          </AuthButton>
          <AuthButton variant="secondary" onClick={() => navigate('/register')}>
            Register
          </AuthButton>
        </div>

        {/* Subtle Accent */}
        <div className="absolute -left-10 -bottom-10 w-24 h-24 bg-accent opacity-[0.03] rounded-full blur-2xl"></div>
      </div>

      <ServerConfigModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Welcome;
