import React from 'react';

interface PasswordStrengthMeterProps {
    password: string;
}

export default function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
    const calculateStrength = (pwd: string) => {
        let score = 0;
        if (!pwd) return 0;

        if (pwd.length >= 8) score += 1;
        if (/[A-Z]/.test(pwd)) score += 1;
        if (/[0-9]/.test(pwd)) score += 1;
        if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

        return score;
    };

    const strength = calculateStrength(password);

    const getStrengthLabel = (score: number) => {
        switch (score) {
            case 0: return 'Muy débil';
            case 1: return 'Débil';
            case 2: return 'Regular';
            case 3: return 'Buena';
            case 4: return 'Segura';
            default: return '';
        }
    };

    const getStrengthColor = (score: number) => {
        switch (score) {
            case 0: return 'bg-gray-200';
            case 1: return 'bg-red-500';
            case 2: return 'bg-orange-500';
            case 3: return 'bg-yellow-500';
            case 4: return 'bg-green-500';
            default: return 'bg-gray-200';
        }
    };

    const getBarWidth = (score: number) => {
        if (score === 0) return '0%';
        return `${(score / 4) * 100}%`;
    };

    return (
        <div className="mt-2 space-y-1">
            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-300 ${getStrengthColor(strength)}`}
                    style={{ width: getBarWidth(strength) }}
                ></div>
            </div>
            {password && (
                <div className="flex justify-between items-center text-xs">
                    <span className={`font-medium ${strength <= 2 ? 'text-gray-500' : 'text-green-600'}`}>
                        {getStrengthLabel(strength)}
                    </span>
                    <span className="text-gray-400">
                        {strength}/4 requisitos
                    </span>
                </div>
            )}
        </div>
    );
}
