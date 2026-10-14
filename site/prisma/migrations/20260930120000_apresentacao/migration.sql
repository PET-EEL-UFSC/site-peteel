-- CreateTable
CREATE TABLE "Apresentacao" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "enviadoPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Apresentacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Apresentacao_chave_key" ON "Apresentacao"("chave");

-- CreateIndex
CREATE INDEX "Apresentacao_criadoEm_idx" ON "Apresentacao"("criadoEm");

-- AddForeignKey
ALTER TABLE "Apresentacao" ADD CONSTRAINT "Apresentacao_enviadoPorId_fkey" FOREIGN KEY ("enviadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
