
import { MercadoPagoConfig } from 'mercadopago';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env from api package
dotenv.config({ path: path.join(__dirname, '../../.env') });

const createTestUser = async () => {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
        console.error('❌ MP_ACCESS_TOKEN missing in .env');
        process.exit(1);
    }

    console.log('Using Access Token:', accessToken.slice(0, 10) + '...');

    try {
        const response = await fetch('https://api.mercadopago.com/users/test_user', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                site_id: 'MLA',
                description: 'Test User for PCFIX'
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('\n✅ Nuevo Usuario de Prueba Creado:');
            console.log('-----------------------------------');
            console.log('User ID:', data.id);
            console.log('Email:', data.email); // Need to verify if 'email' or 'nickname' is the login user
            console.log('Username:', data.nickname);
            console.log('Password:', data.password);
            console.log('-----------------------------------');
            console.log('⚠️ Guarda estos datos. Son válidos por 60 días.');
        } else {
            console.error('❌ Error creando usuario:', data);
        }

    } catch (e) {
        console.error('❌ Error de conexión:', e);
    }
};

createTestUser();
