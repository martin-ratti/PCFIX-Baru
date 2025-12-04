/*
  Warnings:

  - A unique constraint covering the columns `[googleId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "VentaEstado" AS ENUM ('PENDIENTE_PAGO', 'PENDIENTE_APROBACION', 'APROBADO', 'ENVIADO', 'ENTREGADO', 'RECHAZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoConsulta" AS ENUM ('PENDIENTE', 'RESPONDIDO');

-- AlterTable
ALTER TABLE "Categoria" ADD COLUMN     "padreId" INTEGER;

-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "alto" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "ancho" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "marcaId" INTEGER,
ADD COLUMN     "peso" DECIMAL(10,3) NOT NULL DEFAULT 0.5,
ADD COLUMN     "precioOriginal" DECIMAL(10,2),
ADD COLUMN     "profundidad" INTEGER NOT NULL DEFAULT 10;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "googleId" TEXT,
ALTER COLUMN "password" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Venta" ADD COLUMN     "codigoSeguimiento" TEXT,
ADD COLUMN     "comprobante" TEXT,
ADD COLUMN     "costoEnvio" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "estado" "VentaEstado" NOT NULL DEFAULT 'PENDIENTE_PAGO',
ADD COLUMN     "etiquetaUrl" TEXT,
ADD COLUMN     "metodoEnvio" TEXT NOT NULL DEFAULT 'CORREO_ARGENTINO',
ADD COLUMN     "tipoEnvio" TEXT;

-- CreateTable
CREATE TABLE "Marca" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "logo" TEXT,

    CONSTRAINT "Marca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Banner" (
    "id" SERIAL NOT NULL,
    "imagen" TEXT NOT NULL,
    "marcaId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "userId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("userId","productoId")
);

-- CreateTable
CREATE TABLE "Configuracion" (
    "id" SERIAL NOT NULL,
    "nombreBanco" TEXT NOT NULL DEFAULT 'Banco Nación',
    "titular" TEXT NOT NULL DEFAULT 'PCFIX S.A.',
    "cbu" TEXT NOT NULL DEFAULT '0000000000000000000000',
    "alias" TEXT NOT NULL DEFAULT 'PCFIX.VENTAS',
    "costoEnvioFijo" DECIMAL(10,2) NOT NULL DEFAULT 5000,

    CONSTRAINT "Configuracion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultaTecnica" (
    "id" SERIAL NOT NULL,
    "asunto" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "respuesta" TEXT,
    "estado" "EstadoConsulta" NOT NULL DEFAULT 'PENDIENTE',
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "ConsultaTecnica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_items" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Marca_nombre_key" ON "Marca"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_marcaId_fkey" FOREIGN KEY ("marcaId") REFERENCES "Marca"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_padreId_fkey" FOREIGN KEY ("padreId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Banner" ADD CONSTRAINT "Banner_marcaId_fkey" FOREIGN KEY ("marcaId") REFERENCES "Marca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultaTecnica" ADD CONSTRAINT "ConsultaTecnica_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
