-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('ADMIN', 'EDITOR');

-- CreateEnum
CREATE TYPE "StatusPagina" AS ENUM ('RASCUNHO', 'PUBLICADA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT,
    "imagem" TEXT,
    "emailVerified" TIMESTAMP(3),
    "papel" "Papel" NOT NULL DEFAULT 'EDITOR',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "gestao" TEXT,
    "convidadoPorId" TEXT,
    "primeiroAcesso" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Pagina" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "status" "StatusPagina" NOT NULL DEFAULT 'RASCUNHO',
    "blocos" JSONB NOT NULL DEFAULT '[]',
    "rascunho" JSONB,
    "paiId" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "noMenu" BOOLEAN NOT NULL DEFAULT true,
    "fixa" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pagina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaginaRevisao" (
    "id" TEXT NOT NULL,
    "paginaId" TEXT NOT NULL,
    "blocos" JSONB NOT NULL,
    "resumo" TEXT,
    "autorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaginaRevisao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Midia" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "largura" INTEGER NOT NULL,
    "altura" INTEGER NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "enviadoPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Midia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Config" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "nomeSite" TEXT NOT NULL DEFAULT 'PET EEL',
    "descricao" TEXT NOT NULL DEFAULT 'Programa de Educação Tutorial de Engenharia Elétrica — UFSC',
    "endereco" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "instagram" TEXT,
    "linkedin" TEXT,
    "facebook" TEXT,
    "spotify" TEXT,
    "avisoTexto" TEXT,
    "avisoLink" TEXT,
    "avisoAtivo" BOOLEAN NOT NULL DEFAULT false,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Petiano" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "tutor" BOOLEAN NOT NULL DEFAULT false,
    "bio" TEXT,
    "fotoId" TEXT,
    "entrouEm" TIMESTAMP(3) NOT NULL,
    "saiuEm" TIMESTAMP(3),
    "destino" TEXT,
    "lattes" TEXT,
    "linkedin" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Petiano_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_ativo_idx" ON "User"("ativo");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Pagina_slug_key" ON "Pagina"("slug");

-- CreateIndex
CREATE INDEX "Pagina_status_idx" ON "Pagina"("status");

-- CreateIndex
CREATE INDEX "Pagina_paiId_ordem_idx" ON "Pagina"("paiId", "ordem");

-- CreateIndex
CREATE INDEX "PaginaRevisao_paginaId_criadoEm_idx" ON "PaginaRevisao"("paginaId", "criadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "Midia_chave_key" ON "Midia"("chave");

-- CreateIndex
CREATE INDEX "Midia_criadoEm_idx" ON "Midia"("criadoEm");

-- CreateIndex
CREATE INDEX "Petiano_saiuEm_ordem_idx" ON "Petiano"("saiuEm", "ordem");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_convidadoPorId_fkey" FOREIGN KEY ("convidadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pagina" ADD CONSTRAINT "Pagina_paiId_fkey" FOREIGN KEY ("paiId") REFERENCES "Pagina"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaginaRevisao" ADD CONSTRAINT "PaginaRevisao_paginaId_fkey" FOREIGN KEY ("paginaId") REFERENCES "Pagina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaginaRevisao" ADD CONSTRAINT "PaginaRevisao_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Midia" ADD CONSTRAINT "Midia_enviadoPorId_fkey" FOREIGN KEY ("enviadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Petiano" ADD CONSTRAINT "Petiano_fotoId_fkey" FOREIGN KEY ("fotoId") REFERENCES "Midia"("id") ON DELETE SET NULL ON UPDATE CASCADE;
