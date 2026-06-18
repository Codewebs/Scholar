import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AuthButton from '../components/ui/AuthButton';
import AuthInput from '../components/ui/AuthInput';

const Register: React.FC = () => {
  const navigate = useNavigate();

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

        <form className="space-y-5 flex-1">
          <AuthInput label="Full Name" placeholder="John Doe" />
          <AuthInput label="Email" placeholder="john@example.com" />
          <AuthInput label="Password" type="password" placeholder="••••••••" />
          <AuthInput label="Confirm Password" type="password" placeholder="••••••••" />

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
          <AuthButton onClick={() => navigate('/waiting-room')}>
            Register
          </AuthButton>
        </div>
      </div>
    </div>
  );
};

export default Register;
