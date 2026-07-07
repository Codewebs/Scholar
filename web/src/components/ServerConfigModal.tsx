import React, { useState } from 'react';
import { X, Globe, CheckCircle2, RotateCcw } from 'lucide-react';
import AuthInput from './ui/AuthInput';
import AuthButton from './ui/AuthButton';
import { useUI } from '../context/UIContext';
import { useTranslation } from 'react-i18next';

interface ServerConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ServerConfigModal: React.FC<ServerConfigModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { settings, updateSetting, resetSettings } = useUI();
  const [url, setUrl] = useState(localStorage.getItem('server_url') || 'http://localhost:4000');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http')) {
      formattedUrl = `http://${formattedUrl}`;
    }
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

  const ScalingControl = ({ label, value, onChange, min = 0.7, max = 1.3, step = 0.05 }: any) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center px-1">
        <label className="text-[9px] font-black uppercase text-[#9E9E9E] tracking-widest">{label}</label>
        <span className="text-[10px] font-black text-accent">{(value * 100).toFixed(0)}%</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-black"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-white rounded-[40px] p-10 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        <button onClick={onClose} className="absolute top-8 right-8 p-2 hover:bg-gray-100 rounded-full transition-colors z-20">
          <X size={20} />
        </button>

        <div className="mb-8 flex justify-between items-start">
          <div>
            <div className="w-12 h-12 bg-accent/10 text-accent rounded-soft flex items-center justify-center mb-4">
              <Globe size={24} />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">{t('server_config.title')}</h2>
            <p className="text-sm text-[#9E9E9E] font-medium mt-1 uppercase tracking-widest italic">{t('server_config.subtitle')}</p>
          </div>
          <button
            onClick={resetSettings}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-500 transition-all"
          >
            <RotateCcw size={14} /> {t('server_config.reset')}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-8 custom-scrollbar">
          <div className="bg-gray-50/50 p-6 rounded-3xl space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black border-b border-black/5 pb-2">{t('server_config.connection_settings')}</h3>
            <AuthInput
                label={t('server_config.server_url')}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="http://192.168.1.100:4000"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-2">
            <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black">{t('server_config.global_interface')}</h3>
                <ScalingControl
                    label={t('server_config.general_size')}
                    value={settings.globalDensity}
                    onChange={(v: number) => updateSetting('globalDensity', v)}
                />
                <ScalingControl
                    label={t('server_config.sidebar_width')}
                    value={settings.sidebarScale}
                    onChange={(v: number) => updateSetting('sidebarScale', v)}
                />
            </div>

            <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black">{t('server_config.menu_elements')}</h3>
                <ScalingControl
                    label={t('server_config.card_size')}
                    value={settings.dashboardCardScale}
                    onChange={(v: number) => updateSetting('dashboardCardScale', v)}
                />
                <ScalingControl
                    label={t('server_config.text_size')}
                    value={settings.textScale}
                    onChange={(v: number) => updateSetting('textScale', v)}
                />
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
            <AuthButton onClick={handleSave} variant={saved ? 'violet' : 'primary'}>
                {saved ? (
                <span className="flex items-center">
                    <CheckCircle2 size={20} className="mr-2" /> {t('server_config.config_applied')}
                </span>
                ) : t('server_config.save_changes')}
            </AuthButton>
        </div>

        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-accent opacity-[0.05] rounded-full blur-2xl pointer-events-none"></div>
      </div>
    </div>
  );
};

export default ServerConfigModal;
