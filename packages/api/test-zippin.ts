import axios from 'axios';

// Credenciales correctas
const API_TOKEN = '1738518b-ae7b-423f-90a4-80c5ee8c160f';
const API_SECRET = '7ef5ff5e-31e8-4895-838a-6c34e97f33e7';
const ACCOUNT_ID = '20222';
const ORIGIN_ID = 373370;

async function testShippingQuote() {
    console.log("🚚 PROBANDO COTIZACIÓN ZIPNOVA...\n");

    const credentials = Buffer.from(`${API_TOKEN}:${API_SECRET}`).toString('base64');
    const headers = {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };

    const payload = {
        account_id: ACCOUNT_ID,
        origin_id: ORIGIN_ID,
        declared_value: 50000, // $500 ARS en centavos
        items: [{
            weight: 1000, // 1kg en gramos
            height: 15,
            width: 20,
            length: 30,
            description: 'Producto PCFIX Test',
            classification_id: 1
        }],
        destination: {
            zipcode: '1425',
            city: 'Buenos Aires',
            state: 'Buenos Aires'
        }
    };

    console.log("📦 Payload:", JSON.stringify(payload, null, 2));
    console.log("\n");

    try {
        const response = await axios.post(
            'https://api.zipnova.com.ar/v2/shipments/quote',
            payload,
            { headers }
        );
        console.log("✅ ÉXITO! Cotización recibida:");
        console.log(JSON.stringify(response.data, null, 2));
    } catch (e: any) {
        console.log("❌ Error:", e.response?.status);
        console.log(JSON.stringify(e.response?.data, null, 2));
    }
}

testShippingQuote();