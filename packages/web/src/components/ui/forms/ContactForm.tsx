import React, { useState } from 'react';
import { useToastStore } from '../../../stores/toastStore';
import { fetchApi } from '../../../utils/api';

export default function ContactForm() {
    const [isLoading, setIsLoading] = useState(false);
    const addToast = useToastStore((state) => state.addToast);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        mensaje: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nombre || !formData.email || !formData.mensaje) {
            addToast('Por favor completa los campos obligatorios.', 'error');
            return;
        }

        if (!emailRegex.test(formData.email)) {
            addToast('Por favor ingresa un email válido.', 'error');
            return;
        }

        setIsLoading(true);
/* unused:         const toastId = 'contact-toast'; */
        
        
        addToast('Enviando mensaje...', 'info');

        try {
            const res = await fetchApi('/config/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (data.success) {
                addToast('Mensaje enviado. Te responderemos pronto.', 'success');
                setFormData({ nombre: '', apellido: '', email: '', telefono: '', mensaje: '' });
            } else {
                throw new Error(data.error || 'Error al enviar');
            }
        } catch (error: any) {
            console.error('Contact Form Error:', error);
            addToast(error.message || 'Error de conexión. Intenta nuevamente.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre</label>
                    <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        placeholder="Tu nombre"
                        required
                        disabled={isLoading}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Apellido</label>
                    <input
                        type="text"
                        name="apellido"
                        value={formData.apellido}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        placeholder="Tu apellido"
                        disabled={isLoading}
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder="tu@email.com"
                    required
                    disabled={isLoading}
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono (Opcional)</label>
                <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder="+54..."
                    disabled={isLoading}
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mensaje</label>
                <textarea
                    name="mensaje"
                    value={formData.mensaje}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                    placeholder="¿En qué podemos ayudarte?"
                    required
                    disabled={isLoading}
                ></textarea>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-opacity-90 transition-all shadow-lg hover:shadow-primary/30 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Enviando...</span>
                    </>
                ) : (
                    <>
                        <span>Enviar Consulta</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"></path>
                        </svg>
                    </>
                )}
            </button>
        </form>
    );
}
