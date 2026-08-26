# Publicar o site

Ordem importa: banco → segredos → deploy → Google → seed. O login do
Google precisa da URL final do site, que só existe depois do primeiro
deploy — por isso ele vem depois.

---

## 1. Banco de dados (Neon)

1. Crie conta em **neon.tech** e um projeto chamado `peteel`, região
   `AWS São Paulo (sa-east-1)` — é a mais perto da UFSC.
2. Na tela do projeto, em **Connection string**, pegue **duas** URLs:
   - com **Connection pooling ligado** → vai virar `DATABASE_URL`
   - com **pooling desligado** (Direct connection) → vai virar `DIRECT_URL`

Monte assim (acrescente o que está em negrito ao que a Neon te deu):

```
DATABASE_URL="postgresql://…-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connection_limit=5&pool_timeout=20"
DIRECT_URL="postgresql://…sa-east-1.aws.neon.tech/neondb?sslmode=require"
```

São duas porque o pooler não executa migração (DDL): a aplicação usa a
pooled, o `prisma migrate` usa a direta.

Dois detalhes que quebram o deploy se faltarem:

- **Tire o `channel_binding=require`** que a Neon põe na URL. O driver do
  Prisma não lida com esse parâmetro. O `sslmode=require` continua, então
  a conexão segue criptografada.
- **`connection_limit=5&pool_timeout=20`**, não `connection_limit=1`. A
  receita de "1 conexão por função" é para o runtime serverless, mas o
  `next build` pré-renderiza as 25 páginas em paralelo e estoura uma
  conexão só — o build morre com `P2024: Timed out fetching a new
  connection`. Cinco conexões dão conta do build e continuam de bom
  tamanho no runtime, já que quem faz o pooling de verdade é a Neon.

## 2. Segredo de sessão

```bash
openssl rand -base64 32
```

Guarde o resultado, é o `AUTH_SECRET`. Um valor novo derruba todas as
sessões abertas — gere uma vez e não troque à toa.

## 3. Subir para o GitHub

O repositório já está criado localmente, com o primeiro commit feito.

```bash
cd /Users/maeda/peteel
gh repo create peteel --private --source=. --push
```

Ou crie o repositório pela web e:

```bash
git remote add origin git@github.com:USUARIO/peteel.git
git push -u origin main
```

> Coloque no nome de uma **conta do grupo**, não pessoal. O PET troca de
> gestão todo ano; se o repositório ficar na conta de quem se formou, a
> próxima gestão perde o site.

## 4. Deploy na Vercel

1. **vercel.com** → Add New → Project → importe o repositório.
2. **Root Directory: `site`** ← o repositório tem o mockup na raiz, o
   projeto Next fica nessa pasta. Se errar isso, o build falha.
3. Framework: Next.js (detecta sozinho).
4. Em **Environment Variables**, adicione:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | a pooled do passo 1 |
| `DIRECT_URL` | a direta do passo 1 |
| `AUTH_SECRET` | o do passo 2 |
| `NEXTAUTH_URL` | `https://SEU-PROJETO.vercel.app` (ajuste depois se usar domínio próprio) |
| `ADMIN_INICIAL` | o Gmail do primeiro administrador |
| `STORAGE` | `blob` |
| `AUTH_GOOGLE_ID` | deixe vazio por ora — passo 6 |
| `AUTH_GOOGLE_SECRET` | idem |

5. **Storage → Create → Blob**, conecte ao projeto. A Vercel injeta o
   `BLOB_READ_WRITE_TOKEN` sozinha.
6. Deploy. As migrações rodam no build (`prisma migrate deploy`).

O site sobe funcionando, mas **vazio** — sem páginas e sem login. Os dois
próximos passos resolvem isso.

## 5. Popular o banco

Uma vez só, da sua máquina, apontando para a Neon:

```bash
cd site
DATABASE_URL="<a pooled>" DIRECT_URL="<a direta>" ADMIN_INICIAL="seu@gmail.com" npx tsx prisma/seed.ts
```

Cria o primeiro administrador, a configuração do site e as 25 páginas.
É idempotente: rodar de novo não duplica nada.

## 6. Login com Google

Agora que a URL existe:

1. **console.cloud.google.com** → novo projeto `PET EEL`.
2. **APIs e serviços → Tela de consentimento OAuth**:
   - Tipo: **Externo**
   - Nome do app: `PET EEL`, e-mail de suporte: o do grupo
   - **Publicar o app** (em modo Teste só entram e-mails que você listar
     manualmente, e expira em 7 dias)
3. **Credenciais → Criar → ID do cliente OAuth → Aplicativo da Web**:

   **Origens JavaScript autorizadas**
   ```
   https://SEU-PROJETO.vercel.app
   http://localhost:3000
   ```

   **URIs de redirecionamento autorizados**
   ```
   https://SEU-PROJETO.vercel.app/api/auth/callback/google
   http://localhost:3000/api/auth/callback/google
   ```

   O caminho `/api/auth/callback/google` tem que ser exato — é o erro
   mais comum aqui (`redirect_uri_mismatch`).

4. Copie o **ID do cliente** e a **Chave secreta** para `AUTH_GOOGLE_ID`
   e `AUTH_GOOGLE_SECRET` na Vercel, e **faça redeploy** (variável de
   ambiente nova só vale no próximo build).

## 7. Fechar a porta dos fundos

```bash
rm -rf src/app/entrar/dev
git commit -am "remove atalho de login de desenvolvimento" && git push
```

Era o atalho para ver o painel antes do OAuth existir. Ele já é inerte em
produção (dupla trava: `NODE_ENV` e `PERMITIR_LOGIN_DEV`), mas com o
Google funcionando não há motivo para o código continuar existindo.

## 8. Conferir

- [ ] site abre e mostra as páginas
- [ ] `/entrar` → entrar com Google → cai no painel
- [ ] `/entrar/dev` devolve 404
- [ ] Acessos: adicionar alguém, essa pessoa consegue entrar
- [ ] um Gmail **não** cadastrado é recusado
- [ ] subir uma imagem e ver ela numa página
- [ ] editar, publicar, e conferir no site público

---

## Domínio da UFSC

Se o PET conseguir algo como `peteel.ufsc.br`, peça à TI um **CNAME**
apontando para `cname.vercel-dns.com`, adicione o domínio em
Vercel → Settings → Domains, e depois atualize:

- `NEXTAUTH_URL` para o novo endereço
- as duas listas no Google Cloud (origens e redirecionamento)

## Passar o site para a próxima gestão

O que precisa trocar de mãos: repositório no GitHub, projeto na Vercel,
projeto na Neon, projeto no Google Cloud. Se todos estiverem numa conta
do grupo, é só repassar a senha. Se estiverem em conta pessoal, cada um
precisa ser transferido individualmente — por isso a recomendação de já
começar institucional.

Dentro do site, promover a próxima gestão é em **Acessos**: adicionar as
pessoas como Administrador antes de desativar as antigas. O sistema não
deixa remover o último administrador ativo.
