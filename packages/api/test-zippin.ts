import axios from 'axios';
// 👇 CORRECCIÓN: Usamos require para evitar problemas de tipos en este script suelto
const { Buffer } = require('buffer');

// TUS CREDENCIALES REALES
const CLIENT_ID = '1738518b-ae7b-423f-90a4-80c5ee8c160f';
const CLIENT_SECRET = '7ef5ff5e-31e8-4895-838a-6c34e97f33e7';

async function testConnection() {
    console.log("🕵️ INICIANDO DIAGNÓSTICO DE CONEXIÓN ZIPPIN/ZIPNOVA...\n");

    // PRUEBA 1: JSON Body a la raíz (Estándar Moderno)
    try {
        console.log("👉 PRUEBA 1: JSON Body a https://api.zippin.com.ar/oauth/token");
        const res1 = await axios.post('https://api.zippin.com.ar/oauth/token', {
            grant_type: 'client_credentials',
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET
        }, { headers: { 'Content-Type': 'application/json' } });
        console.log("✅ ÉXITO PRUEBA 1! Token:", res1.data.access_token.substring(0, 10) + "...");
        return; 
    } catch (e: any) {
        console.log("❌ Falló Prueba 1:", e.response?.status, e.response?.data);
    }

    console.log("---------------------------------------------------");

    // PRUEBA 2: Form-UrlEncoded a la raíz (Estándar Legacy)
    try {
        console.log("👉 PRUEBA 2: Form-UrlEncoded a https://api.zippin.com.ar/oauth/token");
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', CLIENT_ID);
        params.append('client_secret', CLIENT_SECRET);
        
        const res2 = await axios.post('https://api.zippin.com.ar/oauth/token', params, { 
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' } 
        });
        console.log("✅ ÉXITO PRUEBA 2! Token:", res2.data.access_token.substring(0, 10) + "...");
        return;
    } catch (e: any) {
        console.log("❌ Falló Prueba 2:", e.response?.status, e.response?.data);
    }

    console.log("---------------------------------------------------");

    // PRUEBA 3: Basic Auth Header (Estándar Strict)
    try {
        console.log("👉 PRUEBA 3: Basic Auth Header a https://api.zippin.com.ar/oauth/token");
        const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
        const res3 = await axios.post('https://api.zippin.com.ar/oauth/token', 
            'grant_type=client_credentials', 
            { 
                headers: { 
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                } 
            }
        );
        console.log("✅ ÉXITO PRUEBA 3! Token:", res3.data.access_token.substring(0, 10) + "...");
        return;
    } catch (e: any) {
        console.log("❌ Falló Prueba 3:", e.response?.status, e.response?.data);
    }
    
    console.log("---------------------------------------------------");

    // PRUEBA 4: URL v1 (Backup)
    try {
        console.log("👉 PRUEBA 4: JSON a https://api.zippin.com.ar/v1/oauth/token");
        const res4 = await axios.post('https://api.zippin.com.ar/v1/oauth/token', {
            grant_type: 'client_credentials',
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET
        }, { headers: { 'Content-Type': 'application/json' } });
        console.log("✅ ÉXITO PRUEBA 4! Token:", res4.data.access_token.substring(0, 10) + "...");
        return;
    } catch (e: any) {
        console.log("❌ Falló Prueba 4:", e.response?.status, e.response?.data);
    }

    console.log("\n⚠️ RESULTADO FINAL: Ninguna combinación funcionó.");
}

testConnection();