-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "enviadoPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Documento_chave_key" ON "Documento"("chave");

-- CreateIndex
CREATE INDEX "Documento_criadoEm_idx" ON "Documento"("criadoEm");

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_enviadoPorId_fkey" FOREIGN KEY ("enviadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Petiano" ADD COLUMN "curriculoId" TEXT;

-- AddForeignKey
ALTER TABLE "Petiano" ADD CONSTRAINT "Petiano_curriculoId_fkey" FOREIGN KEY ("curriculoId") REFERENCES "Documento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
