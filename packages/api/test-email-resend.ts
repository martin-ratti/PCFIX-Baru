import 'dotenv/config';
import { EmailService } from './src/shared/services/EmailService';

async function main() {
    console.log('Testing EmailService with Resend...');

    if (!process.env.RESEND_API_KEY) {
        console.error('❌ RESEND_API_KEY is missing in process.env');
        // Try to verify if it's loaded
        console.log('Current env keys:', Object.keys(process.env).filter(k => k.includes('RESEND')));
    } else {
        console.log('✅ RESEND_API_KEY found');
    }

    const emailService = new EmailService();

    // Attempt validation
    const success = await emailService.sendEmail(
        'delivered@resend.dev',
        'Test Email from PCFIX',
        '<h1>It works!</h1><p>This is a test email sent via Resend.</p>'
    );

    if (success) {
        console.log('✅ Test email sent successfully!');
    } else {
        console.error('❌ Failed to send test email.');
    }
}

main();
