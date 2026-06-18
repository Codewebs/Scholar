import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const WaitingRoom: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/initial-config');
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#9E9E9E] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-[450px] bg-white p-12 rounded-[32px] shadow-2xl flex flex-col items-center text-center">
        {/* Loading Animation - Minimalist Violet */}
        <div className="w-24 h-24 mb-10 relative flex items-center justify-center">
          <div className="w-full h-full border-[4px] border-gray-100 rounded-full"></div>
          <div className="absolute inset-0 border-[4px] border-accent rounded-full border-t-transparent animate-spin"></div>
        </div>

        <h1 className="text-4xl font-black text-black mb-4 uppercase tracking-tighter">Please wait.</h1>
        <p className="text-[10px] text-[#9E9E9E] font-black uppercase tracking-widest leading-relaxed max-w-[280px]">
          Nous configurons votre espace de travail, cela ne prendra que quelques secondes.
        </p>
      </div>
    </div>
  );
};

export default WaitingRoom;
