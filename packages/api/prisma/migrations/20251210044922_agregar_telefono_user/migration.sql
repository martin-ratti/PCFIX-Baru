-- DropForeignKey
ALTER TABLE "Cliente" DROP CONSTRAINT "Cliente_userId_fkey";

-- DropForeignKey
ALTER TABLE "ConsultaTecnica" DROP CONSTRAINT "ConsultaTecnica_userId_fkey";

-- DropForeignKey
ALTER TABLE "Favorite" DROP CONSTRAINT "Favorite_userId_fkey";

-- DropForeignKey
ALTER TABLE "LineaVenta" DROP CONSTRAINT "LineaVenta_ventaId_fkey";

-- DropForeignKey
ALTER TABLE "Pago" DROP CONSTRAINT "Pago_ventaId_fkey";

-- DropForeignKey
ALTER TABLE "Venta" DROP CONSTRAINT "Venta_clienteId_fkey";

-- AlterTable
ALTER TABLE "Configuracion" ADD COLUMN     "maintenanceMode" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpires" TIMESTAMP(3),
ADD COLUMN     "telefono" TEXT;

-- AlterTable
ALTER TABLE "Venta" ADD COLUMN     "ciudadEnvio" TEXT,
ADD COLUMN     "cpEnvio" TEXT,
ADD COLUMN     "direccionEnvio" TEXT,
ADD COLUMN     "documentoEnvio" TEXT,
ADD COLUMN     "provinciaEnvio" TEXT,
ADD COLUMN     "telefonoEnvio" TEXT,
ADD COLUMN     "zipnovaShipmentId" TEXT;

-- CreateTable
CREATE TABLE "Cart" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "abandonedEmailSent" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" SERIAL NOT NULL,
    "cartId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockAlert" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "productoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cart_userId_key" ON "Cart"("userId");

-- CreateIndex
CREATE INDEX "CartItem_cartId_idx" ON "CartItem"("cartId");

-- CreateIndex
CREATE INDEX "CartItem_productoId_idx" ON "CartItem"("productoId");

-- CreateIndex
CREATE UNIQUE INDEX "StockAlert_email_productoId_key" ON "StockAlert"("email", "productoId");

-- CreateIndex
CREATE INDEX "Banner_marcaId_idx" ON "Banner"("marcaId");

-- CreateIndex
CREATE INDEX "Cliente_userId_idx" ON "Cliente"("userId");

-- CreateIndex
CREATE INDEX "Cliente_localidadId_idx" ON "Cliente"("localidadId");

-- CreateIndex
CREATE INDEX "ConsultaTecnica_userId_idx" ON "ConsultaTecnica"("userId");

-- CreateIndex
CREATE INDEX "ConsultaTecnica_estado_idx" ON "ConsultaTecnica"("estado");

-- CreateIndex
CREATE INDEX "LineaVenta_ventaId_idx" ON "LineaVenta"("ventaId");

-- CreateIndex
CREATE INDEX "LineaVenta_productoId_idx" ON "LineaVenta"("productoId");

-- CreateIndex
CREATE INDEX "Localidad_provinciaId_idx" ON "Localidad"("provinciaId");

-- CreateIndex
CREATE INDEX "Pago_ventaId_idx" ON "Pago"("ventaId");

-- CreateIndex
CREATE INDEX "Pago_metodoPagoId_idx" ON "Pago"("metodoPagoId");

-- CreateIndex
CREATE INDEX "Producto_categoriaId_idx" ON "Producto"("categoriaId");

-- CreateIndex
CREATE INDEX "Producto_marcaId_idx" ON "Producto"("marcaId");

-- CreateIndex
CREATE INDEX "Producto_isFeatured_idx" ON "Producto"("isFeatured");

-- CreateIndex
CREATE INDEX "Producto_deletedAt_idx" ON "Producto"("deletedAt");

-- CreateIndex
CREATE INDEX "Venta_clienteId_idx" ON "Venta"("clienteId");

-- CreateIndex
CREATE INDEX "Venta_estado_idx" ON "Venta"("estado");

-- CreateIndex
CREATE INDEX "Venta_fecha_idx" ON "Venta"("fecha");

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAlert" ADD CONSTRAINT "StockAlert_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineaVenta" ADD CONSTRAINT "LineaVenta_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultaTecnica" ADD CONSTRAINT "ConsultaTecnica_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
