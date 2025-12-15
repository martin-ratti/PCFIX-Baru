import 'dotenv/config';
import { EmailService } from '../src/shared/services/EmailService';

async function verifyEmailService() {
    console.log('🔍 Probando EmailService Class...');
    console.log(`RESEND_API_KEY: ${process.env.RESEND_API_KEY ? 'DEFINED' : 'MISSING'}`);
    console.log(`EMAIL_FROM: ${process.env.EMAIL_FROM}`);
    console.log(`RESEND_FROM: ${process.env.RESEND_FROM}`);

    const service = new EmailService();

    try {
        console.log('📧 Intentando enviar Welcome Email...');

        // Test with the owner email to be safe, simulating a registration
        const recipient = 'pcfixbaru@gmail.com';
        const result = await service.sendWelcomeEmail(recipient, 'TestUser');

        if (result) {
            console.log('✅ sendWelcomeEmail devolvió TRUE');
        } else {
            console.error('❌ sendWelcomeEmail devolvió FALSE (Revisa logs anteriores)');
        }

    } catch (error: any) {
        console.error('❌ Excepción ejecutando servicio:', error);
    }
}

verifyEmailService();
