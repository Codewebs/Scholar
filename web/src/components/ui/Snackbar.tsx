import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface SnackbarProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Snackbar: React.FC<SnackbarProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-lg flex items-center justify-between min-w-[300px] z-50 ${type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
      <p className="font-medium text-sm">{message}</p>
      <button onClick={onClose} className="ml-4 hover:bg-white/20 p-1 rounded-full">
        <X size={16} />
      </button>
    </div>
  );
};

export default Snackbar;
