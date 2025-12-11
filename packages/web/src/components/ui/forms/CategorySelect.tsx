import React, { useState, useRef, useEffect } from 'react';

interface Category {
    id: number;
    nombre: string;
    subcategorias?: Category[];
}

interface CategorySelectProps {
    categories: Category[];
    value: number;
    onChange: (value: number) => void;
    error?: string;
    placeholder?: string;
}

export default function CategorySelect({ categories, value, onChange, error, placeholder = "Seleccionar..." }: CategorySelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Find selected option label
    const getSelectedLabel = () => {
        if (!value) return placeholder;

        for (const cat of categories) {
            if (cat.id === value) return cat.nombre;
            if (cat.subcategorias) {
                const sub = cat.subcategorias.find(s => s.id === value);
                if (sub) return sub.nombre;
            }
        }
        return placeholder;
    };

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (id: number) => {
        onChange(id);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <button
                type="button" // Prevent form submission
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full mt-1 p-2 border rounded-md bg-white text-left flex justify-between items-center ${error ? 'border-red-500' : 'border-gray-300'
                    }`}
            >
                <span className={`block truncate ${!value ? 'text-gray-500' : 'text-gray-900'}`}>
                    {getSelectedLabel()}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clipRule="evenodd" />
                    </svg>
                </span>
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm top-full">
                    {categories.length === 0 ? (
                        <div className="p-2 text-gray-500 text-center">No hay categorías</div>
                    ) : (
                        categories.map(cat => (
                            <React.Fragment key={cat.id}>
                                {/* Parent Category */}
                                <div
                                    className={`cursor-pointer select-none py-2 pl-3 pr-9 font-bold hover:bg-indigo-50 ${value === cat.id ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900'}`}
                                    onClick={() => handleSelect(cat.id)}
                                >
                                    {cat.nombre}
                                </div>

                                {/* Subcategories */}
                                {cat.subcategorias?.map(sub => (
                                    <div
                                        key={sub.id}
                                        className={`cursor-pointer select-none py-2 pl-8 pr-9 hover:bg-indigo-50 flex items-center gap-2 ${value === sub.id ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900'}`}
                                        onClick={() => handleSelect(sub.id)}
                                    >
                                        <span className="text-gray-400">↳</span>
                                        {sub.nombre}
                                    </div>
                                ))}
                            </React.Fragment>
                        ))
                    )}
                </div>
            )}

            {error && <span className="text-red-500 text-xs mt-1 block">{error}</span>}
        </div>
    );
}
