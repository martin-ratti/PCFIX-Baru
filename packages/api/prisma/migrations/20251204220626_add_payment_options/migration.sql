-- AlterTable
ALTER TABLE "Configuracion" ADD COLUMN     "binanceAlias" TEXT DEFAULT 'PCFIX.USDT',
ADD COLUMN     "binanceCbu" TEXT DEFAULT 'PAY-ID-123456',
ADD COLUMN     "direccionLocal" TEXT DEFAULT 'Av. Corrientes 1234, CABA',
ADD COLUMN     "horariosLocal" TEXT DEFAULT 'Lun a Vie: 10 a 18hs';

-- AlterTable
ALTER TABLE "Venta" ADD COLUMN     "medioPago" TEXT NOT NULL DEFAULT 'TRANSFERENCIA',
ADD COLUMN     "tipoEntrega" TEXT NOT NULL DEFAULT 'ENVIO';
