# 🏡 Chá de Casa Nova · Lorena & Arthur

Site para lista de presentes do Chá de Casa Nova com reserva por WhatsApp, controle de quantidade no Supabase, Pix opcional e painel administrativo.

---

## Funcionalidades principais

- Página pública moderna, romântica e responsiva.
- Lista de presentes com quantidade desejada e quantidade disponível.
- Reserva com apenas o WhatsApp do convidado.
- Opções: levar o presente no dia ou mandar Pix.
- Pix aparece somente depois que o convidado escolhe Pix.
- QR Code Pix editável pelo painel admin.
- Reserva atômica via RPC `reserve_gift` com `SELECT FOR UPDATE`.
- Cancelamento de reserva com devolução automática de estoque via RPC `cancel_reservation`.
- Painel admin protegido por senha simples.
- Modo surpresa: a tela de convidados não mostra qual presente foi reservado.
- Área “Revelar surpresas” liberada somente após digitar `REVELAR SURPRESAS`.
- Upload de imagens via Supabase Storage.

---

## Instalação local

```bash
npm install
npm run dev
```

Acesse:

- Site público: `http://localhost:5173`
- Admin: `http://localhost:5173/admin`

No Windows, se `npm` der erro de permissão no PowerShell, rode pelo CMD:

```bat
npm.cmd install
npm.cmd run dev
```

---

## Configuração do Supabase

1. Crie um projeto no Supabase.
2. Em **Settings → API**, copie o **Project URL** e a chave **anon public**.
3. Crie `.env` a partir de `.env.example` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Abra **SQL Editor** e execute o arquivo:

```text
supabase/schema.sql
```

Depois, confirme em **Storage** que o bucket `wedding-gifts` existe e está público. Reinicie `npm run dev` sempre que alterar o `.env`; o Vite só lê essas variáveis ao iniciar. Em `/admin`, teste o cadastro de presente sem imagem e com uma imagem JPG, JPEG, PNG ou WEBP de até 5 MB. O preview aparece antes de salvar e a URL pública é gravada em `image_url`.

O SQL cria:

- `site_settings`
- `gift_categories`
- `gifts`
- `gift_reservations`
- Função `reserve_gift`
- Função `cancel_reservation`
- Policies RLS
- Bucket público `wedding-gifts`
- Categorias iniciais
- Configuração inicial do evento

Depois de executar o SQL, troque no banco o valor de Pix inicial se ainda estiver como:

```text
[COLOCAR_EMAIL_PIX_AQUI]
```

Também dá para editar a chave Pix pelo painel admin.

---

## Variáveis de ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
VITE_ADMIN_PASSWORD=sua_senha_admin_aqui
```

Você encontra a URL e a anon key em:

```text
Supabase Dashboard → Settings → API
```

Use uma senha admin forte. Não use `123456`, `admin` ou data de nascimento.

---

## Publicar na Vercel

## Como cadastrar a lista inicial de presentes

1. Execute primeiro `supabase/schema.sql` no SQL Editor do Supabase.
2. Execute `supabase/seed_gifts.sql` no mesmo editor para inserir as categorias e a lista padrão.
3. Como alternativa, acesse o painel administrativo, abra **Gerenciar presentes** e clique em **Importar lista padrão**.

As duas opções são idempotentes: itens já cadastrados são ignorados, sem apagar ou sobrescrever nome, foto, preço, quantidade ou reservas existentes. Os presentes entram com preço Pix vazio e imagens temporárias, que podem ser ajustados no admin.

1. Suba o projeto para o GitHub.
2. Importe o repositório na Vercel.
3. Configure as variáveis:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ADMIN_PASSWORD`
4. Faça o deploy.

---

## Scripts úteis

```bash
npm run dev       # rodar local
npm run build     # build de produção
npm run preview   # testar build local
npm run typecheck # checar TypeScript
```

---

## Segurança — leia antes de publicar

Brutalmente honesto: o painel usa senha simples no frontend. Isso é prático para um projeto pessoal de chá de casa nova, mas não é segurança forte.

O que está seguro o suficiente para este caso:

- A reserva do convidado é feita por RPC atômica.
- O último item não deve ser reservado duas vezes.
- Não existe service role no frontend.
- O convidado não consegue inserir reserva diretamente; a reserva passa pela função `reserve_gift`.
- O painel comum não mostra o presente reservado.

Limitação importante:

- Como o admin não usa Supabase Auth nem backend privado, algumas policies permitem escrita/leitura com anon key para o painel funcionar. Para um sistema realmente blindado, o ideal seria refazer o admin com Supabase Auth, Edge Functions ou backend próprio.

Para o seu caso — lista de presentes de casamento/chá de casa nova — está aceitável. Para loja, financeiro, dados pessoais sensíveis ou sistema profissional, não use essa arquitetura sem autenticação real.

---

## Fluxo de reserva

1. Convidado escolhe o presente.
2. Informa apenas o WhatsApp.
3. Escolhe “Vou levar no dia” ou “Prefiro mandar Pix”.
4. O sistema chama `reserve_gift`.
5. O Supabase bloqueia a linha do presente com `SELECT FOR UPDATE`.
6. Se ainda houver quantidade, diminui 1 unidade.
7. Salva a reserva.
8. Mostra confirmação.
9. Se escolheu Pix, mostra chave Pix, botão copiar e QR Code.

---

## Cancelamento correto

Quando uma reserva é cancelada no admin:

- A função `cancel_reservation` marca a reserva como cancelada.
- A quantidade do presente é devolvida automaticamente.
- A quantidade nunca passa da quantidade desejada.

Esse ponto foi corrigido porque apenas mudar o status para “cancelado” sem devolver estoque deixaria presente preso como indisponível.

---

## Checklist de testes

- [ ] Página pública abre no celular e desktop.
- [ ] Admin abre em `/admin`.
- [ ] Senha admin funciona.
- [ ] Admin edita textos do site.
- [ ] Admin troca imagem de capa.
- [ ] Admin cadastra presente.
- [ ] Admin edita presente.
- [ ] Admin exclui presente sem reserva.
- [ ] Admin cria categoria.
- [ ] Convidado reserva presente informando só WhatsApp.
- [ ] Quantidade disponível diminui após reserva.
- [ ] Quando quantidade chega em 0, aparece “Já reservado”.
- [ ] Presente esgotado não pode ser reservado.
- [ ] Pix só aparece se convidado escolher Pix.
- [ ] QR Code Pix aparece corretamente.
- [ ] WhatsApp do convidado aparece no admin.
- [ ] Presente reservado não aparece na tela normal de convidados.
- [ ] Presente reservado só aparece em “Revelar surpresas”.
- [ ] Cancelar reserva devolve quantidade ao presente.
- [ ] Dados continuam salvos após atualizar a página.
- [ ] Dados continuam salvos em outro navegador ou celular.

---

## Design

## Observação sobre o Storage

Como o painel administrativo usa uma senha simples no frontend, as policies do bucket `wedding-gifts` permitem leitura pública e upload, atualização e exclusão pela role `anon`. Isso é aceitável para este projeto pessoal, mas não oferece segurança máxima. Para um sistema com requisitos maiores de segurança, use Supabase Auth e operações de escrita em backend ou Edge Functions.

- Preto/cinza escuro.
- Branco off-white.
- Dourado/champagne suave.
- Glassmorphism.
- Tipografia elegante.
- Mobile-first.
