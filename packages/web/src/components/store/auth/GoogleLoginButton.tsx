import React from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../../../stores/authStore';
import { useToastStore } from '../../../stores/toastStore';
import { API_URL } from '../../../utils/api';

export default function GoogleLoginButton() {
  const login = useAuthStore((state) => state.login);
  const addToast = useToastStore((state) => state.addToast);

  // Leer variables de entorno (Astro)
  const CLIENT_ID = import.meta.env.PUBLIC_GOOGLE_CLIENT_ID;

  // FIX: Usamos la URL directa de producción para asegurar la conexión

  // API_URL is imported

  if (!CLIENT_ID) {
    console.error("Falta PUBLIC_GOOGLE_CLIENT_ID en el archivo .env");
    return null; // No mostramos el botón si no hay configuración
  }

  const handleSuccess = async (credentialResponse: any) => {
    try {
      // Enviamos el token de Google a nuestro Backend
      const res = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential })
      });

      const json = await res.json();

      if (json.success) {
        // Login exitoso: Guardamos sesión
        login(json.data.token, json.data.user);
        addToast(`¡Hola de nuevo, ${json.data.user.nombre}!`, 'success');

        // Redirección forzada (Hard Reload para limpiar estado)
        setTimeout(() => {
          if (json.data.user.role === 'ADMIN') window.location.href = '/admin';
          else window.location.href = '/';
        }, 100);

      } else {
        throw new Error(json.error || "Error de autenticación");
      }

    } catch (error: any) {
      console.error(error);
      addToast(error.message || 'Error al iniciar sesión con Google', 'error');
    }
  };

  return (
    <div className="w-full flex justify-center mt-4">
      <GoogleOAuthProvider clientId={CLIENT_ID}>
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => addToast('Falló la conexión con Google', 'error')}
          theme="outline"
          size="large"
          // FIX: Google requiere píxeles en string, NO porcentajes. "350" es un buen ancho.
          width="350"
          text="continue_with"
          shape="pill"
          useOneTap={false} // Opcional: desactiva el popup automático si molesta
        />
      </GoogleOAuthProvider>
    </div>
  );
}