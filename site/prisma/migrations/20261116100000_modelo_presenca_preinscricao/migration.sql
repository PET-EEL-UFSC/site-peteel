-- AlterTable
ALTER TABLE "Minicurso" ADD COLUMN     "inscricoesAbertas" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "modeloCertificadoId" TEXT;

-- CreateTable
CREATE TABLE "PreInscricao" (
    "id" TEXT NOT NULL,
    "minicursoId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "matricula" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PreInscricao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModeloCertificado" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "fundoMidiaId" TEXT,
    "caixas" JSONB NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModeloCertificado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MinicursoMinistrante" (
    "minicursoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "MinicursoMinistrante_pkey" PRIMARY KEY ("minicursoId","userId")
);

-- CreateTable
CREATE TABLE "Encontro" (
    "id" TEXT NOT NULL,
    "minicursoId" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "titulo" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Encontro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Presenca" (
    "encontroId" TEXT NOT NULL,
    "inscricaoId" TEXT NOT NULL,

    CONSTRAINT "Presenca_pkey" PRIMARY KEY ("encontroId","inscricaoId")
);

-- CreateIndex
CREATE INDEX "PreInscricao_minicursoId_criadoEm_idx" ON "PreInscricao"("minicursoId", "criadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "PreInscricao_minicursoId_email_key" ON "PreInscricao"("minicursoId", "email");

-- CreateIndex
CREATE INDEX "MinicursoMinistrante_userId_idx" ON "MinicursoMinistrante"("userId");

-- CreateIndex
CREATE INDEX "Encontro_minicursoId_data_idx" ON "Encontro"("minicursoId", "data");

-- CreateIndex
CREATE INDEX "Presenca_inscricaoId_idx" ON "Presenca"("inscricaoId");

-- AddForeignKey
ALTER TABLE "Minicurso" ADD CONSTRAINT "Minicurso_modeloCertificadoId_fkey" FOREIGN KEY ("modeloCertificadoId") REFERENCES "ModeloCertificado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreInscricao" ADD CONSTRAINT "PreInscricao_minicursoId_fkey" FOREIGN KEY ("minicursoId") REFERENCES "Minicurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModeloCertificado" ADD CONSTRAINT "ModeloCertificado_fundoMidiaId_fkey" FOREIGN KEY ("fundoMidiaId") REFERENCES "Midia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MinicursoMinistrante" ADD CONSTRAINT "MinicursoMinistrante_minicursoId_fkey" FOREIGN KEY ("minicursoId") REFERENCES "Minicurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MinicursoMinistrante" ADD CONSTRAINT "MinicursoMinistrante_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Encontro" ADD CONSTRAINT "Encontro_minicursoId_fkey" FOREIGN KEY ("minicursoId") REFERENCES "Minicurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presenca" ADD CONSTRAINT "Presenca_encontroId_fkey" FOREIGN KEY ("encontroId") REFERENCES "Encontro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presenca" ADD CONSTRAINT "Presenca_inscricaoId_fkey" FOREIGN KEY ("inscricaoId") REFERENCES "Inscricao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
┌─────────────────────────────────────────────────────────┐
│  Update available 6.19.3 -> 8.0.0-rc.33                 │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘

