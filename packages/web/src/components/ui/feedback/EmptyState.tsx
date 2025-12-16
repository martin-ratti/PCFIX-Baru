import React from 'react';
import { cn } from '../../../utils/cn';

interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    action?: {
        label: string;
        onClick?: () => void;
        href?: string;
    };
    className?: string;
}

export default function EmptyState({
    title,
    description,
    icon,
    action,
    className
}: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center p-8 text-center animate-fade-in", className)}>
            {icon && (
                <div className="mb-6 bg-gray-50 rounded-full p-6 text-gray-400">
                    {icon}
                </div>
            )}

            <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>

            {description && (
                <p className="text-gray-500 max-w-sm mb-8">{description}</p>
            )}

            {action && (
                action.href ? (
                    <a
                        href={action.href}
                        className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95"
                    >
                        {action.label}
                    </a>
                ) : (
                    <button
                        onClick={action.onClick}
                        className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95"
                    >
                        {action.label}
                    </button>
                )
            )}
        </div>
    );
}
