import React, { useState, useEffect, useRef } from 'react';
import { navigate } from 'astro:transitions/client';
import { fetchApi } from '../../../utils/api';
// Removed lucide-react import 
// Previous analysis showed usage of lucide-react in RegisterForm was removed. So it is likely NOT available.
// I will use SVGs.

export default function LiveSearch() {
    const [term, setTerm] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [history, setHistory] = useState<string[]>([]);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Load history on mount
    useEffect(() => {
        const saved = localStorage.getItem('search_history');
        if (saved) {
            try {
                setHistory(JSON.parse(saved));
            } catch (e) { }
        }
    }, []);

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Live Search logic
    useEffect(() => {
        if (term.length < 2) {
            setResults([]);
            // keep open if focused to show history? handled by onFocus
            if (term.length === 0) {
                // Show history logic could be here if we want list to change
            }
            return;
        }

        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const timeoutId = setTimeout(async () => {
            setIsLoading(true);
            try {
                const res = await fetchApi(`/products?search=${encodeURIComponent(term)}&limit=5&minimal=true`, {
                    signal: controller.signal
                });
                const json = await res.json();
                if (json.success) {
                    setResults(json.data);
                    setIsOpen(true);
                }
            } catch (error: any) {
                if (error.name !== 'AbortError') {
                    console.error(error);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        }, 300); // 300ms Debounce

        return () => clearTimeout(timeoutId);
    }, [term]);

    const saveToHistory = (query: string) => {
        const newHistory = [query, ...history.filter(h => h !== query)].slice(0, 5);
        setHistory(newHistory);
        localStorage.setItem('search_history', JSON.stringify(newHistory));
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (term.trim()) {
            saveToHistory(term.trim());
            setIsOpen(false);
            navigate(`/productos?search=${encodeURIComponent(term.trim())}`);
        }
    };

    const goToProduct = (product: any) => {
        saveToHistory(product.nombre);
        setIsOpen(false);
        setTerm('');
        navigate(`/producto/${product.id}`); // Using ID as slug based on service optimization
    };

    const handleHistoryClick = (val: string) => {
        setTerm(val);
        // Let the effect trigger the search or navigate directly?
        // Usually users expect clicking history to search or fill. 
        // Let's fill and trigger search via effect
    };

    const highlightMatch = (text: string, query: string) => {
        if (!query) return text;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === query.toLowerCase()
                ? <b key={i} className="text-primary">{part}</b>
                : part
        );
    };

    return (
        <div ref={wrapperRef} className="relative w-full max-w-full hidden md:block z-50">
            <form onSubmit={handleSearch} className="relative group">
                <input
                    type="text"
                    placeholder="Buscar productos (ej: GPU, RAM)..."
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-blue-200/30 bg-blue-900/20 text-white placeholder-blue-200 focus:bg-white focus:text-gray-900 focus:border-white focus:ring-2 focus:ring-blue-400 outline-none transition-all shadow-inner font-medium"
                />

                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 group-focus-within:text-gray-500 transition-colors">
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                    )}
                </div>
            </form>

            {isOpen && (
                <div className="absolute top-full left-0 w-full bg-white mt-2 rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in-down">

                    {/* History Section */}
                    {term.length < 2 && history.length > 0 && (
                        <div className="p-2 border-b border-gray-100">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Recientes
                            </div>
                            <div className="flex flex-wrap gap-2 px-2">
                                {history.map((h, i) => (
                                    <button key={i} onClick={() => handleHistoryClick(h)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs text-gray-700 transition-colors">
                                        {h}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Results Section */}
                    {term.length >= 2 && results.length > 0 && (
                        <ul>
                            {results.map((product) => (
                                <li key={product.id}>
                                    <button
                                        onClick={() => goToProduct(product)}
                                        className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex justify-between items-center group border-b border-gray-50 last:border-0"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-800 text-sm line-clamp-1 group-hover:text-primary transition-colors">
                                                {highlightMatch(product.nombre, term)}
                                            </span>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {product.categoria?.nombre && (
                                                    <span className="bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                                        {product.categoria.nombre}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="font-mono font-bold text-gray-900 text-sm whitespace-nowrap ml-4">
                                            ${Number(product.precio).toLocaleString('es-AR')}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* No results */}
                    {term.length >= 2 && results.length === 0 && !isLoading && (
                        <div className="p-4 text-center text-sm text-gray-500">
                            No econtramos productos para "{term}"
                        </div>
                    )}

                    {/* Footer */}
                    {results.length > 0 && (
                        <div onClick={handleSearch} className="bg-gray-50 p-3 text-center text-xs font-bold text-blue-600 cursor-pointer hover:bg-blue-600 hover:text-white transition-colors border-t border-gray-100">
                            Ver todos los resultados &rarr;
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
