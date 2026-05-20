-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'UNPAID', 'PARTIAL');

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "paymentDate" TIMESTAMP(3),
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "paymentReference" TEXT,
ADD COLUMN     "tuitionFee" DOUBLE PRECISION,
ADD COLUMN     "tuitionPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "tuitionStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID';
