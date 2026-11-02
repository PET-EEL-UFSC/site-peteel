-- AlterTable
-- menor privilégio por padrão: usuário criado sem papel explícito não vira editor
ALTER TABLE "User" ALTER COLUMN "papel" SET DEFAULT 'ALUNO';

-- AlterTable
ALTER TABLE "Pagina" ADD COLUMN     "minicursoId" TEXT;

-- CreateTable
CREATE TABLE "Minicurso" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "cargaHoraria" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Minicurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Aluno" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "matricula" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Aluno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inscricao" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "minicursoId" TEXT NOT NULL,
    "certificadoEm" TIMESTAMP(3),
    "certificadoChave" TEXT,
    "certificadoUrl" TEXT,
    "certificadoNome" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inscricao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Minicurso_slug_key" ON "Minicurso"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Aluno_email_key" ON "Aluno"("email");

-- CreateIndex
CREATE INDEX "Inscricao_minicursoId_idx" ON "Inscricao"("minicursoId");

-- CreateIndex
CREATE UNIQUE INDEX "Inscricao_alunoId_minicursoId_key" ON "Inscricao"("alunoId", "minicursoId");

-- CreateIndex
CREATE INDEX "Pagina_minicursoId_idx" ON "Pagina"("minicursoId");

-- AddForeignKey
ALTER TABLE "Pagina" ADD CONSTRAINT "Pagina_minicursoId_fkey" FOREIGN KEY ("minicursoId") REFERENCES "Minicurso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscricao" ADD CONSTRAINT "Inscricao_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscricao" ADD CONSTRAINT "Inscricao_minicursoId_fkey" FOREIGN KEY ("minicursoId") REFERENCES "Minicurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;
