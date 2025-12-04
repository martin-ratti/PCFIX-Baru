export default function WhatsAppButton() {
  // Reemplaza con el número real (549 + area + numero)
  const phoneNumber = "5493464513588"; 
  const message = "Hola PCFIX! Estoy viendo su web y tengo una consulta.";
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a 
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-[100] group flex items-center justify-center w-16 h-16 bg-[#25D366] text-white rounded-full shadow-[0_4px_14px_rgba(37,211,102,0.5)] hover:shadow-[0_6px_20px_rgba(37,211,102,0.6)] hover:-translate-y-1 transition-all duration-300"
      aria-label="Contactar por WhatsApp"
    >
      {/* Tooltip Flotante */}
      <span className="absolute right-full mr-3 bg-white text-gray-800 text-sm font-bold px-3 py-1.5 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none border border-gray-100">
        ¿Necesitas ayuda?
        {/* Triangulito del tooltip */}
        <span className="absolute top-1/2 right-[-6px] -mt-1 border-4 border-transparent border-l-white"></span>
      </span>

      {/* Icono Oficial WhatsApp */}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="32" 
        height="32" 
        fill="currentColor" 
        viewBox="0 0 16 16"
      >
        <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.099-.836-.306-1.592-.98-1.002-1.153.52-.27.826-.258 1.153-.02.109-.033.196 0 .284.033.089.149.197.215.326.066.13.066.763-.253 1.326-.27.476-.606.657-1.141.578z"/>
      </svg>
    </a>
  );
}