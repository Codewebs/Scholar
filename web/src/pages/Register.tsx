import React, { useState, useEffect } from 'react';
import { authService } from '../api/authService';
import { useNavigate, Link } from 'react-router-dom';
import Snackbar from '../components/ui/Snackbar';
import { ArrowLeft } from 'lucide-react';
import AuthButton from '../components/ui/AuthButton';
import AuthInput from '../components/ui/AuthInput';
import { useTranslation } from 'react-i18next';

const Register: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Email regex validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  useEffect(() => {
    if (email && !emailRegex.test(email)) {
      setEmailError(t('register.errors.email_invalid'));
    } else {
      setEmailError('');
    }
  }, [email, t]);

  useEffect(() => {
    if (password && password.length < 4) {
      setPasswordError(t('register.errors.password_too_short'));
    } else {
      setPasswordError('');
    }
  }, [password, t]);

  useEffect(() => {
    if (confirmPassword && confirmPassword !== password) {
      setConfirmPasswordError(t('register.errors.passwords_dont_match'));
    } else {
      setConfirmPasswordError('');
    }
  }, [confirmPassword, password, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !confirmPassword) {
      setSubmitError(t('register.errors.fill_all_fields'));
      return;
    }
    if (emailError || passwordError || confirmPasswordError) {
      setSubmitError(t('register.errors.correct_errors'));
      return;
    }

    setSubmitError(null);
    setLoading(true);

    try {
      // On génère un identifiant par défaut basé sur le nom
      const identifiant = fullName.toLowerCase().replace(/\s+/g, '.');

      await authService.register({
        identifiant,
        nom: fullName,
        email,
        telephone: '0000000000',
        password,
        confirmPassword
      });

      setSnackbar({ message: t('register.success'), type: 'success' });
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      const msg = err.response?.data?.message || t('register.errors.register_error');
      setSubmitError(msg);
      setSnackbar({ message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#9E9E9E] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-[450px] bg-white min-h-[700px] p-10 rounded-[32px] shadow-2xl flex flex-col relative">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors w-10 h-10 flex items-center justify-center mb-8"
        >
          <ArrowLeft size={24} className="text-black" />
        </button>

        <div className="mb-10">
          <h1 className="text-4xl font-black text-black mb-2 tracking-tighter uppercase">{t('register.title')}</h1>
          <p className="text-lg text-[#9E9E9E] font-medium leading-tight">
            {t('register.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 flex-1">
          <AuthInput
            label={t('register.label_name')}
            placeholder={t('register.placeholder_name')}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <AuthInput
            label={t('register.label_email')}
            placeholder={t('register.placeholder_email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError}
            required
          />
          <AuthInput
            label={t('register.label_password')}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={passwordError}
            required
          />
          <AuthInput
            label={t('register.label_confirm_password')}
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={confirmPasswordError}
            required
          />

          {submitError && (
            <div className="text-red-500 text-[10px] font-black uppercase tracking-tight text-center bg-red-50 p-3 rounded-sharp border border-red-100">
              {submitError}
            </div>
          )}

          <div className="pt-8 text-center">
            <p className="text-xs font-black text-[#9E9E9E] uppercase tracking-widest">
              {t('register.already_have_account')}{' '}
              <Link to="/login" className="text-black hover:text-accent transition-colors">
                {t('register.login_link')}
              </Link>
            </p>
          </div>
        </form>

        <div className="mt-8">
          <AuthButton onClick={handleSubmit} disabled={loading}>
            {loading ? t('register.loading') : t('register.register_button')}
          </AuthButton>
        </div>

        {snackbar && (
          <Snackbar
            message={snackbar.message}
            type={snackbar.type}
            onClose={() => setSnackbar(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Register;
