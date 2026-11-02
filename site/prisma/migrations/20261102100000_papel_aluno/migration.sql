-- AlterEnum
-- Sozinho de propósito: o Postgres não deixa usar o valor novo do enum na
-- mesma transação em que ele nasce (o SET DEFAULT fica na migration seguinte).
ALTER TYPE "Papel" ADD VALUE 'ALUNO';
