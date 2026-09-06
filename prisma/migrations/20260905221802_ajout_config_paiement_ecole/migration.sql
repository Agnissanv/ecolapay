-- AlterTable
ALTER TABLE "ecoles" ADD COLUMN     "cinetpayApiKey" TEXT,
ADD COLUMN     "cinetpaySiteId" TEXT,
ADD COLUMN     "fraisConfortPourcent" INTEGER,
ADD COLUMN     "paiementEnLigneActif" BOOLEAN NOT NULL DEFAULT false;
