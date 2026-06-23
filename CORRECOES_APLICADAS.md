# Correções aplicadas

## Validações feitas

- `npm run typecheck` passou sem erros.
- `npm run build` passou sem erros.
- `npm audit` ficou com 0 vulnerabilidades.

## Correções principais

1. **Cancelamento agora devolve estoque**
   - Adicionada RPC `cancel_reservation` no Supabase.
   - Quando uma reserva é cancelada, a quantidade disponível do presente volta automaticamente.
   - A quantidade nunca ultrapassa a quantidade desejada.

2. **Reserva continua atômica e mais segura**
   - RPC `reserve_gift` mantém `SELECT FOR UPDATE`.
   - Validação de WhatsApp também foi reforçada no banco.
   - Adicionado `SET search_path = public` nas funções `SECURITY DEFINER`.

3. **Modo surpresa melhorado**
   - A tela normal de “Convidados” não busca mais nome do presente no select.
   - Isso reduz o risco de estragar a surpresa no uso normal do painel.
   - A revelação completa continua somente na aba “Revelar surpresas”.

4. **Data e horário corrigidos para Brasília**
   - Corrigido risco de aparecer/salvar horário errado por causa de UTC/local timezone.
   - Inputs de data agora convertem corretamente para horário de Brasília.

5. **Dashboard melhorado**
   - Data e nome do evento agora vêm das configurações do Supabase, não ficam fixos no código.

6. **Upload de imagem melhorado**
   - Preview agora sincroniza quando a URL muda.
   - Nome de arquivo ficou mais seguro.
   - Mantida validação de tipo e limite de 5MB.

7. **Validação de presentes reforçada**
   - Quantidade desejada precisa ser pelo menos 1.
   - Quantidade disponível não pode ser negativa.
   - Valor Pix não pode ser negativo.
   - Quantidade disponível não pode passar da desejada.

8. **Schema Supabase mais robusto**
   - SQL agora pode ser executado mais de uma vez sem quebrar policies.
   - Adicionados índices.
   - Adicionados triggers de `updated_at`.
   - Adicionado índice para garantir apenas uma linha de `site_settings`.

9. **Dependências corrigidas**
   - Vite atualizado.
   - Adicionado override do `esbuild`.
   - `npm audit` agora retorna 0 vulnerabilidades.

10. **README refeito**
    - Incluído alerta honesto sobre a limitação de senha simples no frontend.
    - Incluídas instruções de build, typecheck, Supabase, Vercel e checklist.

## Ponto brutalmente honesto

A arquitetura ainda usa senha simples no frontend para o admin. Isso é aceitável para um site pessoal de chá de casa nova, mas não é segurança forte. Para blindar de verdade, teria que trocar para Supabase Auth, Edge Functions ou backend próprio.
