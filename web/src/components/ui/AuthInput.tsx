import React from 'react';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  suffix?: React.ReactNode;
  error?: string;
}

const AuthInput: React.FC<AuthInputProps> = ({ label, suffix, error, ...props }) => {
  return (
    <div className="space-y-1.5 w-full">
      <label className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E] ml-1">
        {label.replace('*', '')}
        {label.includes('*') && <span className="text-red-500 ml-1 font-black">*</span>}
      </label>
      <div className="relative flex items-center">
        <input
          className={`w-full h-14 px-4 bg-white border ${
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-100 focus:border-black focus:ring-black'
          } rounded-sharp text-sm font-bold focus:ring-1 outline-none transition-all placeholder:text-gray-200`}
          {...props}
        />
        {suffix && (
          <div className="absolute right-4 text-gray-400 cursor-pointer">
            {suffix}
          </div>
        )}
      </div>
      {error && (
        <p className="text-[10px] text-red-500 font-bold uppercase tracking-wide ml-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default AuthInput;
