import axios from 'axios'; 

export class CryptoService {

  
  async getUsdtPrice(): Promise<number> {
    try {
      const response = await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=USDTARS');

      if (response.data && response.data.price) {
        return Math.ceil(parseFloat(response.data.price));
      }

      throw new Error('Formato de respuesta inválido');
    } catch (error) {
      console.error("🔥 Error conectando con Binance:", error);
      throw new Error("No se pudo obtener la cotización. Intente manual.");
    }
  }
}