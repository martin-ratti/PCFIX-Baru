
import { PhoneIcon, ClockIcon } from '../../SharedIcons'; 

interface ContactInfoProps {
    hours: string;
}

export default function ContactInfo({ hours }: ContactInfoProps) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center divide-y md:divide-y-0 md:divide-x divide-gray-100">
                
                <div className="flex items-center gap-4 px-4 justify-center md:justify-center">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-2xl shrink-0">
                        <PhoneIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5">
                            Atención Telefónica
                        </p>
                        <a
                            href="tel:+543464513588"
                            className="text-lg font-black text-gray-800 hover:text-primary transition-colors block leading-tight"
                        >
                            +54 346 451 3588
                        </a>
                    </div>
                </div>

                
                <div className="flex items-center gap-4 px-4 justify-center md:justify-center pt-4 md:pt-0">
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center text-2xl shrink-0">
                        <ClockIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5">
                            Horarios de Local
                        </p>
                        <p className="text-lg font-bold text-gray-800 leading-tight">
                            {hours}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
