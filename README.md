# ScanIA

Aplicativo mobile para fotografar notas fiscais e recibos e organizar os gastos por categoria. A
leitura é feita no servidor por uma Edge Function, com IA opcional, e os dados podem ser revisados
antes de serem usados no resumo mensal.

## Funcionalidades

- Cadastro, login e sessão persistente com Supabase Auth.
- Captura pela câmera ou galeria, com redução e compressão antes do upload.
- Leitura simulada para desenvolvimento ou leitura real pela API Anthropic.
- Revisão, correção, nova tentativa e exclusão de notas.
- Resumo mensal e gráfico de gastos por categoria.
- Fotos em bucket privado e isolamento por usuário com Row Level Security (RLS).

## Tecnologias

React Native · Expo · Expo Router · TypeScript · Supabase (Auth, Postgres, Storage e Edge
Functions) · Anthropic Claude · TanStack Query · React Hook Form · Zod · Jest

## Requisitos

- Node.js LTS (22 ou superior) e npm.
- Projeto Supabase.
- Expo Go em um aparelho para testar câmera e galeria.
- Chave da Anthropic somente para habilitar a leitura real; o modo simulado não exige chave.

## Configuração

1. Instale as dependências:

   ```sh
   npm install
   ```

2. No Supabase, execute [`supabase/schema.sql`](./supabase/schema.sql) no SQL Editor.
3. Copie `.env.example` para `.env` e preencha as credenciais públicas do projeto:

   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   EXPO_PUBLIC_SUPABASE_KEY=SUA-CHAVE-PUBLICA
   ```

   Nunca coloque uma chave `service_role` ou a chave Anthropic nesse arquivo.

4. Entre e vincule a CLI do Supabase, publique a Edge Function e habilite o modo de teste:

   ```sh
   npx supabase login
   npx supabase link --project-ref SEU-PROJECT-REF
   npx supabase secrets set MOCK_AI=true
   npx supabase functions deploy scan-receipt
   ```

5. Inicie o aplicativo:

   ```sh
   npm start
   ```

   Abra o QR Code no Expo Go. O celular e o computador precisam estar na mesma rede; se a rede
   bloquear a conexão, use `npx expo start --tunnel`.

### Leitura real com Claude

Configure os segredos diretamente no Supabase, nunca no aplicativo:

```sh
npx supabase secrets set ANTHROPIC_API_KEY=sua-chave
npx supabase secrets set MOCK_AI=false
```

O modelo padrão é `claude-haiku-4-5-20251001`. `ANTHROPIC_MODEL` pode ser definido como segredo
para escolher outro modelo compatível. Configure também um limite de gastos na conta Anthropic.
As imagens das notas podem conter dados pessoais: envie apenas imagens cujo processamento por
serviços externos foi autorizado.

## Comandos

| Comando             | Descrição                                  |
| ------------------- | ------------------------------------------ |
| `npm start`         | Inicia o Expo                              |
| `npm run android`   | Inicia o Expo para Android                 |
| `npm run ios`       | Inicia o Expo para iOS                     |
| `npm test`          | Executa as quatro suítes Jest              |
| `npm run typecheck` | Verifica os tipos TypeScript do aplicativo |
| `npm run format`    | Formata os arquivos do projeto             |

## Arquitetura

- `app/`: autenticação, navegação protegida, abas e telas de notas.
- `src/components/`: componentes reutilizáveis da interface.
- `src/hooks/` e `src/services/`: cache TanStack Query e acesso ao Supabase.
- `src/utils/`: lógica pura de moeda, datas, resumos e ícones.
- `supabase/schema.sql`: tabelas, índices, políticas RLS e bucket privado.
- `supabase/functions/scan-receipt/`: Edge Function Deno e validação independente da resposta da IA.
- `__tests__/`: testes de moeda, datas, resumo e normalização do OCR.

## Privacidade e segurança

O bucket `receipts` é privado; cada arquivo fica em uma pasta com o ID do usuário. As políticas
RLS limitam as notas e os itens ao proprietário. A Edge Function recebe a sessão do usuário e
usa esse contexto para acessar o banco e o Storage, mantendo as políticas ativas. A chave
Anthropic existe apenas como segredo da função. A resposta do modelo é normalizada e validada, e
o usuário pode revisar os campos antes de confiar nos valores.

## Autoria

Kathia · [GitHub: @kathiamf](https://github.com/kathiamf)
