import axios from 'axios';

export class ViumiService {
    private clientId: string;
    private clientSecret: string;
    private baseUrl: string;
    private accessToken: string | null = null;
    private tokenExpiry: number | null = null;

    constructor() {
        this.clientId = process.env.VIUMI_CLIENT_ID || '';
        this.clientSecret = process.env.VIUMI_CLIENT_SECRET || '';
        // Default to Sandbox if not specified
        this.baseUrl = process.env.VIUMI_API_URL || 'https://sandbox-apigw.viumi.com.ar';
    }

    private async authenticate() {
        // --- MOCK MODE ---
        if (this.clientId === 'MOCK') {
            console.log('⚠️ VIUMI MOCK MODE: Authenticated');
            return 'mock-access-token';
        }

        // Check if token is still valid (with 5 min buffer)
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry - 300000) {
            return this.accessToken;
        }

        try {
            const response = await axios.post(`${this.baseUrl}/api/v2/auth/token`, {
                client_id: this.clientId,
                client_secret: this.clientSecret,
                grant_type: 'client_credentials'
            });

            this.accessToken = response.data.access_token;
            // Set expiry time (expires_in is usually in seconds)
            this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);

            return this.accessToken;
        } catch (error) {
            console.error('❌ Error autenticando con ViüMi:', error);
            throw new Error('Fallo al autenticar con servicio de pagos');
        }
    }

    async createPaymentPreference(sale: any, items: any[], callbackUrl: string) {
        const token = await this.authenticate();

        // --- MOCK MODE ---
        // Si estamos en modo MOCK, retornamos directamente la URL de éxito para simular un pago aprobado.
        if (this.clientId === 'MOCK') {
            console.log('⚠️ VIUMI MOCK MODE: Returning success URL');
            return callbackUrl;
        }

        const payload = {
            external_reference: sale.id.toString(),
            total_amount: Number(sale.montoTotal),
            description: `Orden #${sale.id} - PCFIX`,
            items: items.map(item => ({
                name: item.nombre,
                quantity: item.cantidad,
                unit_price: Number(item.precio),
                total_amount: Number(item.cantidad) * Number(item.precio)
            })),
            return_url: callbackUrl, // Where user goes after payment
            notification_url: `${process.env.API_URL}/sales/webhook/viumi` // Webhook
        };

        try {
            const response = await axios.post(`${this.baseUrl}/api/v2/orders`, payload, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data.checkout_url;
        } catch (error) {
            console.error('❌ Error creando preferencia ViüMi:', error);
            throw new Error('No se pudo generar el link de pago');
        }
    }
}
