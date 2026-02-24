import { cn } from '../../../utils/cn';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
    variant?: 'rectangular' | 'circular' | 'text';
    width?: string | number;
    height?: string | number;
}

export default function Skeleton({
    className,
    variant = 'rectangular',
    width,
    height,
    style,
    ...props
}: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse bg-gray-200 dark:bg-gray-700",
                {
                    'rounded-full': variant === 'circular',
                    'rounded-md': variant === 'rectangular' || variant === 'text',
                    
                },
                className
            )}
            style={{
                width,
                height,
                ...style
            }}
            {...props}
        />
    );
}
