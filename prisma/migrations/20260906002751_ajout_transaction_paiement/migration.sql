-- CreateEnum
CREATE TYPE "StatutTransaction" AS ENUM ('EN_ATTENTE', 'REUSSI', 'ECHEC');

-- CreateTable
CREATE TABLE "transactions_paiement" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "montantDu" INTEGER NOT NULL,
    "montantFrais" INTEGER NOT NULL,
    "montantTotal" INTEGER NOT NULL,
    "statut" "StatutTransaction" NOT NULL DEFAULT 'EN_ATTENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmeAt" TIMESTAMP(3),
    "ecoleId" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "trancheId" TEXT NOT NULL,
    "paiementId" INTEGER,

    CONSTRAINT "transactions_paiement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transactions_paiement_transactionId_key" ON "transactions_paiement"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_paiement_paiementId_key" ON "transactions_paiement"("paiementId");

-- AddForeignKey
ALTER TABLE "transactions_paiement" ADD CONSTRAINT "transactions_paiement_ecoleId_fkey" FOREIGN KEY ("ecoleId") REFERENCES "ecoles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions_paiement" ADD CONSTRAINT "transactions_paiement_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "eleves"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions_paiement" ADD CONSTRAINT "transactions_paiement_trancheId_fkey" FOREIGN KEY ("trancheId") REFERENCES "tranches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions_paiement" ADD CONSTRAINT "transactions_paiement_paiementId_fkey" FOREIGN KEY ("paiementId") REFERENCES "paiements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
