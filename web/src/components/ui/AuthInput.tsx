import React from 'react';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  suffix?: React.ReactNode;
}

const AuthInput: React.FC<AuthInputProps> = ({ label, suffix, ...props }) => {
  return (
    <div className="space-y-1.5 w-full">
      <label className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E] ml-1">
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          className="w-full h-14 px-4 bg-white border border-gray-100 rounded-sharp text-sm font-bold focus:border-black focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-gray-200"
          {...props}
        />
        {suffix && (
          <div className="absolute right-4 text-gray-400 cursor-pointer">
            {suffix}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthInput;
