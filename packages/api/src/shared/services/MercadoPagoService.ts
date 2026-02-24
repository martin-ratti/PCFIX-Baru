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
        
        const mpItems = items;

        const backendUrl = process.env.API_URL ||
            (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : 'http://localhost:3002');
        const successUrl = `${backendUrl}/api/sales/mp-callback?external_reference=${saleId}`;

        
        const isProduction = backendUrl.includes('https') && !backendUrl.includes('localhost');
        const notificationUrl = isProduction ? `${backendUrl}/api/sales/webhook` : undefined;

        try {
            const body: any = {
                items: mpItems,
                
                external_reference: String(saleId),
                back_urls: {
                    success: successUrl,
                    failure: successUrl,
                    pending: successUrl
                },
                
            };

            if (notificationUrl) {
                body.notification_url = notificationUrl;
            }

            const result = await this.preference.create({ body });

            return result.init_point; 
        } catch (error) {
            console.error('Error creating MP preference:', error);
            console.error('MP Error Details:', JSON.stringify(error, null, 2));
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
