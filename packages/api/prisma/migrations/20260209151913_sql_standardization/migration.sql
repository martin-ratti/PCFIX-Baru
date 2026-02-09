-- AlterTable
ALTER TABLE "Banner" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "ConsultaTecnica" ALTER COLUMN "respondedAt" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "Pago" ALTER COLUMN "fecha" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "Producto" ALTER COLUMN "deletedAt" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "expiresAt" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "StockAlert" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "resetTokenExpires" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "Venta" ALTER COLUMN "fecha" SET DATA TYPE TIMESTAMPTZ(3);

-- CreateIndex
CREATE INDEX "ConsultaTecnica_serviceItemId_idx" ON "ConsultaTecnica"("serviceItemId");
