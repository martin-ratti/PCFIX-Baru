import { MercadoPagoConfig, Preference } from 'mercadopago';

export class MercadoPagoService {
    private client: MercadoPagoConfig;
    private preference: Preference;

    constructor() {
        const accessToken = process.env.MP_ACCESS_TOKEN;
        if (!accessToken) {
            console.warn('MP_ACCESS_TOKEN is not defined');
        }
        this.client = new MercadoPagoConfig({ accessToken: accessToken || '' });
        this.preference = new Preference(this.client);
    }

    async createPreference(saleId: number, items: any[], payerEmail: string) {
        // Items are already formatted by the controller
        const mpItems = items;

        const backendUrl = process.env.API_URL || 'http://localhost:3002'; // Use generic API_URL
        const successUrl = `${backendUrl}/api/sales/mp-callback`;

        try {
            const body = {
                items: mpItems,
                // payer: { email: payerEmail }, // Commented out to avoid Sandbox mismatch (Real Email vs Test User)
                external_reference: String(saleId),
                back_urls: {
                    success: successUrl,
                    failure: successUrl, // Handle all in callback for simplicity or redirect same
                    pending: successUrl
                },
                auto_return: 'approved',
                notification_url: `${backendUrl}/api/sales/webhook`
            };


            const result = await this.preference.create({ body });

            return result.init_point; // URL to redirect user
        } catch (error) {
            console.error('Error creating MP preference:', error);
            throw new Error('Could not create Mercado Pago preference');
        }
    }

    async getPayment(paymentId: string) {
        const { Payment } = require('mercadopago');
        const payment = new Payment(this.client);
        try {
            return await payment.get({ id: paymentId });
        } catch (error) {
            console.error('Error fetching MP payment:', error);
            throw new Error('Could not fetch Mercado Pago payment');
        }
    }
}
