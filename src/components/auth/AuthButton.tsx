import React from 'react';
import { Loader2 } from 'lucide-react';

interface AuthButtonProps {
    onClick?: () => void;
    type?: 'button' | 'submit';
    variant?: 'primary' | 'secondary';
    loading?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
    onClick,
    type = 'button',
    variant = 'primary',
    loading = false,
    disabled = false,
    children
}) => {
    const baseStyles = "w-full py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed";

    const variantStyles = {
        primary: "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]",
        secondary: "bg-white/10 hover:bg-white/20 text-white border border-white/30 hover:border-white/50 backdrop-blur-sm"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseStyles} ${variantStyles[variant]}`}
        >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {children}
        </button>
    );
};
