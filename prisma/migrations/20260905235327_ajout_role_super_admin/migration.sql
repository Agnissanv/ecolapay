-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';

-- DropForeignKey
ALTER TABLE "utilisateurs" DROP CONSTRAINT "utilisateurs_ecoleId_fkey";

-- AlterTable
ALTER TABLE "utilisateurs" ALTER COLUMN "ecoleId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "utilisateurs" ADD CONSTRAINT "utilisateurs_ecoleId_fkey" FOREIGN KEY ("ecoleId") REFERENCES "ecoles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
