import React from 'react';

// Enum matches Prisma VentaEstado
export type OrderStatus = 'PENDIENTE_PAGO' | 'PENDIENTE_APROBACION' | 'APROBADO' | 'ENVIADO' | 'ENTREGADO' | 'RECHAZADO' | 'CANCELADO';

interface OrderTimelineProps {
    status: OrderStatus;
    trackingCode?: string;
    trackingUrl?: string; // e.g. Correo Argentino URL
}

const steps = [
    { label: 'Esperando Pago', status: 'PENDIENTE_PAGO' },
    { label: 'Preparación', status: ['PENDIENTE_APROBACION', 'APROBADO'] },
    { label: 'En Camino', status: 'ENVIADO' },
    { label: 'Entregado', status: 'ENTREGADO' },
];

export default function OrderTimeline({ status, trackingCode, shippingMethod }: OrderTimelineProps & { shippingMethod?: string }) {

    // Dynamic steps based on shipping method
    let stepsToRender = steps;
    if (shippingMethod === 'RETIRO') {
        stepsToRender = [
            { label: 'Esperando Pago', status: ['PENDIENTE_PAGO' as const, 'PENDIENTE_APROBACION' as const] }, // Combine pending states
            { label: 'Listo para retirar', status: ['APROBADO' as const, 'ENVIADO' as const] },
            { label: 'Retirado', status: 'ENTREGADO' as const },
        ];
    }

    // Determine Cancelled/Rejected state
    const isFailed = status === 'RECHAZADO' || status === 'CANCELADO';

    // Determine current active step index dynamically
    let currentStepIndex = 0;
    if (isFailed) {
        currentStepIndex = -1;
    } else {
        // Find the index where the current status matches
        // We reverse find to ensure we get the latest visible step if multiple match (though statuses should be unique usually)
        // Actually, we just need to find which bucket the status falls into.
        const foundIndex = stepsToRender.findIndex(step =>
            Array.isArray(step.status) ? step.status.includes(status) : step.status === status
        );
        if (foundIndex !== -1) currentStepIndex = foundIndex;

        // Fallback for logical progression if status not exact match but implied? 
        // No, status should match.
        // Special case: if 'ENVIADO' is not in RETIRO steps (it is now), etc.
    }

    return (
        <div className="w-full py-6">
            {isFailed ? (
                <div className="flex items-center justify-center p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                    <span className="font-bold mr-2 text-xl">✕</span>
                    <span>El pedido fue {status === 'CANCELADO' ? 'Cancelado' : 'Rechazado'}</span>
                </div>
            ) : (
                <div className="relative flex items-center justify-between w-full">
                    {/* Connecting Line Background */}
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10 rounded"></div>

                    {/* Connecting Line Progress */}
                    <div
                        className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-green-500 -z-10 rounded transition-all duration-1000 ease-out"
                        style={{ width: `${(currentStepIndex / (stepsToRender.length - 1)) * 100}%` }}
                    ></div>

                    {stepsToRender.map((step, index) => {
                        const isCompleted = index <= currentStepIndex;
                        const isCurrent = index === currentStepIndex;

                        return (
                            <div key={index} className="flex flex-col items-center">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white transition-colors duration-500
                                ${isCompleted ? 'border-green-500 text-green-500' : 'border-gray-300 text-gray-300'}
                                ${isCurrent ? 'ring-4 ring-green-100 scale-110' : ''}
                            `}
                                >
                                    {isCompleted ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    ) : (
                                        <span className="text-xs font-bold">{index + 1}</span>
                                    )}
                                </div>
                                <span className={`mt-2 text-xs md:text-sm font-medium ${isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Tracking Link for Shipped Orders */}
            {status === 'ENVIADO' && trackingCode && (
                <div className="mt-6 text-center">
                    <a
                        href={`https://www.correoargentino.com.ar/formularios/e-commerce?id=${trackingCode}`} // Defaulting to Correo Argentino as per context
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                        Seguir Envío ({trackingCode})
                    </a>
                </div>
            )}
        </div>
    );
}
