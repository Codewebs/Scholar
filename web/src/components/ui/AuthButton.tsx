import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'violet';
  fullWidth?: boolean;
}

const AuthButton: React.FC<AuthButtonProps> = ({
  children,
  variant = 'primary',
  fullWidth = true,
  className,
  ...props
}) => {
  const variants = {
    primary: 'bg-black text-white hover:bg-gray-900',
    secondary: 'bg-[#9E9E9E] text-white hover:bg-gray-600',
    violet: 'bg-accent text-white hover:opacity-90',
    outline: 'bg-transparent border border-gray-300 text-black hover:bg-gray-50'
  };

  return (
    <button
      className={cn(
        'h-14 flex items-center justify-center rounded-soft font-black text-sm uppercase tracking-widest transition-all active:scale-[0.98]',
        fullWidth ? 'w-full' : 'px-8',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default AuthButton;
