# Site do PET EEL

Site público + painel de edição por blocos. Next.js 15, TypeScript, Postgres.

## Rodar localmente

```bash
npm install
cp .env.example .env        # preencha as variáveis
npx prisma dev --name peteel  # Postgres local, sem Docker — copie a DATABASE_URL para o .env
npx prisma migrate dev
npm run db:seed             # admin inicial, configuração e as 25 páginas
npm run dev
```

Site em `localhost:3000`, painel em `localhost:3000/admin`.

> A `DATABASE_URL` do `prisma dev` precisa de `pgbouncer=true` (é um pooler,
> e sem isso o Prisma quebra em "prepared statement already exists") e de
> `connection_limit=2` (o `next build` roda vários workers em paralelo; com
> limite alto o servidor local recusa conexão no meio do prerender).

## Login

Google, sem restrição de domínio — o grupo usa Gmail pessoal.

Autenticar no Google **não é** autorização: qualquer pessoa com Gmail passa
pelo Google. Quem decide é a tabela `User`. Só entra quem já tem linha lá e
está ativo, e o admin cria essa linha *antes* do primeiro login da pessoa
(Painel → Acessos).

O primeiro admin vem de `ADMIN_INICIAL` no `.env`, criado pelo seed. Depois
disso a variável pode sair do ambiente — admin convida admin pela interface.

Papéis:

| | Editor | Administrador |
|---|---|---|
| Editar e salvar rascunho | sim | sim |
| Subir imagem | sim | sim |
| Publicar | não | sim |
| Criar/apagar página | não | sim |
| Gerenciar pessoas e acessos | não | sim |

Desativar alguém tem efeito imediato, mesmo com a sessão aberta: o painel
confere o acesso no banco a cada carregamento.

## Conteúdo

Cada página é uma **lista ordenada de blocos**, guardada em JSONB e validada
por Zod (`src/lib/content/`). Reordenar é reordenar o array.

O bloco de trabalho é a **Faixa**: fundo + decoração (raio) + N quadrantes.
As bandas do Florescer e do Processo seletivo são a mesma Faixa com
parâmetros diferentes.

Três regras ficam no código, não na mão de quem edita — se fossem parâmetro
livre, alguma combinação quebraria o site:

- a **cor do texto deriva do fundo** (senão: amarelo sobre amarelo);
- o **conteúdo recua do raio** conforme lado e tamanho (senão: texto por cima
  da decoração em tela estreita);
- o **número de quadrantes tem que casar com o layout** (validado no schema,
  então estado inválido não chega no banco).

A paleta é fechada nos cinco tokens da marca; hex livre fica atrás de um
clique a mais.

O editor tem **prévia ao vivo**: um iframe com a página renderizada de
verdade, atualizando enquanto você digita. É iframe e não render embutido
por causa das media queries — o layout responsivo responde à largura da
janela, então só um documento com viewport próprio consegue mostrar o
celular de verdade. Clicar num bloco da lista rola a prévia até ele.

`blocos` é o que está no ar, `rascunho` é a edição em andamento. Publicar
copia um no outro e guarda a versão anterior em `PaginaRevisao`. Restaurar
uma revisão carrega no rascunho — nada vai ao ar sem publicar.

## Imagens

`alt` é obrigatório no upload, validado no cliente e no servidor. Apagar uma
imagem em uso é bloqueado (varre as páginas antes).

Dev grava em `public/uploads`; produção usa Vercel Blob (`STORAGE=blob`).

## Produção

Vercel + Postgres gerenciado (Neon). Variáveis: `DATABASE_URL`, `AUTH_SECRET`,
`AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `NEXTAUTH_URL`, `STORAGE=blob`,
`BLOB_READ_WRITE_TOKEN`.

As páginas públicas são pré-renderizadas no build e revalidadas ao publicar.

## Comandos

```bash
npm run dev         npm run build      npm start
npm run typecheck   npm run db:migrate npm run db:seed   npm run db:studio
```
