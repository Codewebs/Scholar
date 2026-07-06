import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Globe } from 'lucide-react';
import AuthButton from '../components/ui/AuthButton';
import AuthInput from '../components/ui/AuthInput';
import { authService } from '../api/authService';
import { useAuth } from '../context/AuthContext';
import ServerConfigModal from '../components/ServerConfigModal';
import { useTranslation } from 'react-i18next';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, isAuthenticated, isInitialized } = useAuth();
  const [identifiant, setIdentifiant] = useState('');
  const [mdp, setMdp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      navigate('/app/dashboard', { replace: true });
    }
  }, [isAuthenticated, isInitialized, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifiant || !mdp) {
      setError(t('login.errors.fill_fields'));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await authService.login(identifiant, mdp);
      if (res.data.success) {
        login({
          id: res.data.userId,
          nom: res.data.name,
          email: res.data.email,
          role: res.data.role,
          permissions: []
        }, res.data.token);
        navigate('/waiting-room');
      } else {
        setError(t('login.errors.invalid_credentials'));
      }
    } catch (err: any) {
      setError(err.response?.data?.error || t('login.errors.server_error'));
    } finally {
      setLoading(false);
    }
  };

  if (!isInitialized) return null;

  return (
    <div className="min-h-screen bg-[#9E9E9E] flex items-center justify-center p-4 font-sans relative">
      {/* Rare Violet Accent: Server Config Trigger */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="absolute top-8 right-8 p-4 bg-white rounded-soft shadow-xl border border-gray-100 group transition-all active:scale-95"
      >
        <Globe size={20} className="text-accent group-hover:rotate-12 transition-transform" />
      </button>

      <div className="w-full max-w-[450px] bg-white min-h-[650px] p-10 rounded-[32px] shadow-2xl flex flex-col relative overflow-hidden">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors w-10 h-10 flex items-center justify-center mb-8"
        >
          <ArrowLeft size={24} className="text-black" />
        </button>

        <div className="mb-10">
          <h1 className="text-4xl font-black text-black mb-2 tracking-tighter uppercase">{t('login.title')}</h1>
          <p
            className="text-lg text-[#9E9E9E] font-medium leading-tight"
            dangerouslySetInnerHTML={{ __html: t('login.welcome_back') }}
          />
        </div>

        <form onSubmit={handleLogin} className="space-y-6 flex-1">
          <AuthInput
            label={t('login.label_email')}
            placeholder={t('login.placeholder_email')}
            value={identifiant}
            onChange={(e) => setIdentifiant(e.target.value)}
          />
          <AuthInput
            label={t('login.label_password')}
            type={showPassword ? "text" : "password"}
            placeholder={t('login.placeholder_password')}
            value={mdp}
            onChange={(e) => setMdp(e.target.value)}
            suffix={
              <div onClick={() => setShowPassword(!showPassword)} className="hover:text-accent transition-colors">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </div>
            }
          />

          {error && (
            <div className="text-red-500 text-[10px] font-black uppercase tracking-tight text-center bg-red-50 p-3 rounded-sharp border border-red-100">
              {error}
            </div>
          )}

          <div className="pt-4 flex flex-col items-center">
            <div className="w-full flex items-center mb-8">
              <div className="flex-1 h-[1px] bg-gray-100"></div>
              <span className="px-4 text-[10px] font-black text-gray-300 uppercase tracking-widest">{t('login.or_continue')}</span>
              <div className="flex-1 h-[1px] bg-gray-100"></div>
            </div>

            <div className="flex space-x-4 mb-8">
              {[1, 2, 3].map((i) => (
                <button key={i} type="button" className="w-14 h-14 border border-gray-100 rounded-sharp flex items-center justify-center hover:border-black transition-all shadow-sm">
                  <div className="w-6 h-6 bg-gray-100 rounded-full"></div>
                </button>
              ))}
            </div>

            <p className="text-xs font-black text-[#9E9E9E] uppercase tracking-widest">
              {t('login.no_account')}{' '}
              <Link to="/register" className="text-black hover:text-accent transition-colors">
                {t('login.register_link')}
              </Link>
            </p>
          </div>

          <div className="mt-8">
            <AuthButton type="submit" disabled={loading}>
              {loading ? t('login.loading') : t('login.login_button')}
            </AuthButton>
          </div>
        </form>

        {/* Subtle Accent */}
        <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-accent opacity-[0.03] rounded-full blur-2xl"></div>
      </div>

      <ServerConfigModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Login;
