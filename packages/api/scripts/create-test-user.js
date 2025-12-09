
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load env from api package
dotenv.config({ path: path.join(__dirname, '../.env') });

const createTestUser = async () => {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
        console.error('❌ MP_ACCESS_TOKEN missing in .env');
        process.exit(1);
    }

    console.log('Using Access Token:', accessToken.slice(0, 10) + '...');

    try {
        const response = await axios.post(
            'https://api.mercadopago.com/users/test_user',
            {
                site_id: 'MLA',
                description: 'Test User for PCFIX'
            },
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const data = response.data;

        console.log('\n✅ Nuevo Usuario de Prueba Creado:');
        console.log('-----------------------------------');
        console.log('User ID:', data.id);
        console.log('Username (para login):', data.nickname);
        console.log('Password:', data.password);
        console.log('-----------------------------------');
        console.log('⚠️ Guarda estos datos. Son válidos por 60 días.');

    } catch (e) {
        console.error('❌ Error creando usuario:', e.response?.data || e.message);
    }
};

createTestUser();
