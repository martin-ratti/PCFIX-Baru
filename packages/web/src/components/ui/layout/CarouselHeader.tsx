
import type { LucideIcon } from 'lucide-react';

interface CarouselHeaderProps {
    title: string;
    icon?: LucideIcon;
    iconClass?: string;
}

export default function CarouselHeader({ title, icon: Icon, iconClass }: CarouselHeaderProps) {
    return (
        <h2 className="text-3xl font-bold text-center mb-10 text-secondary flex items-center justify-center gap-3">
            {Icon && <Icon className={iconClass} />}
            {title}
        </h2>
    );
}
