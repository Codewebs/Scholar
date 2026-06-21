import React, { useState, useEffect } from 'react';
import { authService } from '../api/authService';
import { useNavigate, Link } from 'react-router-dom';
import Snackbar from '../components/ui/Snackbar';
import { ArrowLeft } from 'lucide-react';
import AuthButton from '../components/ui/AuthButton';
import AuthInput from '../components/ui/AuthInput';

const Register: React.FC = () => {
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
      setEmailError("Format d'email invalide");
    } else {
      setEmailError('');
    }
  }, [email]);

  useEffect(() => {
    if (password && password.length < 4) {
      setPasswordError('Le mot de passe doit contenir au moins 4 caractères');
    } else {
      setPasswordError('');
    }
  }, [password]);

  useEffect(() => {
    if (confirmPassword && confirmPassword !== password) {
      setConfirmPasswordError('Les mots de passe ne correspondent pas');
    } else {
      setConfirmPasswordError('');
    }
  }, [confirmPassword, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !confirmPassword) {
      setSubmitError('Veuillez remplir tous les champs');
      return;
    }
    if (emailError || passwordError || confirmPasswordError) {
      setSubmitError('Veuillez corriger les erreurs avant de continuer');
      return;
    }

    setSubmitError(null);
    setLoading(true);

    try {
      // Décomposition du nom complet pour correspondre à votre backend
      const [nom, ...rest] = fullName.split(' ');
      const prenom = rest.join(' ');

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

      setSnackbar({ message: "Compte créé avec succès ! Redirection vers la connexion...", type: 'success' });
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Erreur lors de l'inscription";
      setSubmitError(msg);
      setSnackbar({ message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    fullName.trim() !== '' &&
    email.trim() !== '' &&
    password.trim() !== '' &&
    confirmPassword.trim() !== '' &&
    !emailError &&
    !passwordError &&
    !confirmPasswordError;

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
          <h1 className="text-4xl font-black text-black mb-2 tracking-tighter uppercase">Create Account.</h1>
          <p className="text-lg text-[#9E9E9E] font-medium leading-tight">
            Commencez votre voyage avec nous dès aujourd'hui.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 flex-1">
          <AuthInput
            label="Full Name"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <AuthInput
            label="Email"
            placeholder="john@example.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError}
            required
          />
          <AuthInput
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={passwordError}
            required
          />
          <AuthInput
            label="Confirm Password"
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
              Already have an account?{' '}
              <Link to="/login" className="text-black hover:text-accent transition-colors">
                Login
              </Link>
            </p>
          </div>
        </form>

        <div className="mt-8">
          <AuthButton onClick={handleSubmit} disabled={loading}>
            {loading ? "Chargement..." : "Register"}
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
