import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
    password: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password)
    };

    const allPassed = Object.values(checks).every(Boolean);

    if (!password) return null;

    return (
        <div className="mt-2 p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
            <div className="space-y-1">
                <CheckItem passed={checks.length} text="At least 8 characters" />
                <CheckItem passed={checks.uppercase} text="One uppercase letter" />
                <CheckItem passed={checks.lowercase} text="One lowercase letter" />
                <CheckItem passed={checks.number} text="One number" />
            </div>
            {allPassed && (
                <p className="mt-2 text-xs text-green-400 font-semibold">✓ Strong password!</p>
            )}
        </div>
    );
};

const CheckItem: React.FC<{ passed: boolean; text: string }> = ({ passed, text }) => (
    <div className="flex items-center gap-2">
        {passed ? (
            <Check className="w-3 h-3 text-green-400" />
        ) : (
            <X className="w-3 h-3 text-gray-500" />
        )}
        <span className={`text-xs ${passed ? 'text-green-300' : 'text-gray-400'}`}>
            {text}
        </span>
    </div>
);
