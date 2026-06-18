import React, { useState } from 'react';
import { X, Globe, CheckCircle2 } from 'lucide-react';
import AuthInput from './ui/AuthInput';
import AuthButton from './ui/AuthButton';

interface ServerConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ServerConfigModal: React.FC<ServerConfigModalProps> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState(localStorage.getItem('server_url') || 'http://localhost:4000');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http')) {
      formattedUrl = `http://${formattedUrl}`;
    }
    // Remove trailing slash
    if (formattedUrl.endsWith('/')) {
      formattedUrl = formattedUrl.slice(0, -1);
    }

    localStorage.setItem('server_url', formattedUrl);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white rounded-[32px] p-10 shadow-2xl relative overflow-hidden">
        <button onClick={onClose} className="absolute top-8 right-8 p-2 hover:bg-gray-100 rounded-full transition-colors">
          <X size={20} />
        </button>

        <div className="mb-8">
          <div className="w-12 h-12 bg-accent/10 text-accent rounded-soft flex items-center justify-center mb-4">
            <Globe size={24} />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">Configuration Serveur</h2>
          <p className="text-sm text-[#9E9E9E] font-medium mt-1 uppercase tracking-widest">Définir l'URL de l'API</p>
        </div>

        <div className="space-y-6">
          <AuthInput
            label="URL du Serveur"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="http://192.168.1.100:4000"
          />

          <AuthButton onClick={handleSave} variant={saved ? 'violet' : 'primary'}>
            {saved ? (
              <span className="flex items-center">
                <CheckCircle2 size={20} className="mr-2" /> Enregistré
              </span>
            ) : 'Appliquer la configuration'}
          </AuthButton>
        </div>

        {/* Subtle Background Decoration */}
        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-accent opacity-[0.05] rounded-full blur-2xl pointer-events-none"></div>
      </div>
    </div>
  );
};

export default ServerConfigModal;
