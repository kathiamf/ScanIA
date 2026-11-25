# Relatório de desenvolvimento e correções — ScanIA

## 1. Visão Geral e Arquitetura Implementada

O ScanIA foi criado com Expo SDK 58, React Native, TypeScript e Expo Router. A estrutura separa
rotas e telas (`app/`), componentes reutilizáveis, contexto de autenticação, schemas Zod,
serviços/hooks de dados e funções puras de negócio (`src/`).

O fluxo de leitura é: escolher ou fotografar a imagem → reduzir largura e comprimir → enviar ao
bucket privado `receipts` em `user_id/arquivo.jpg` → criar nota `pending` → invocar a Edge
Function `scan-receipt` → validar os dados retornados pela Anthropic (ou pela resposta simulada)
→ gravar nota e itens → revisar/corrigir no app. A função age com o JWT do usuário; as políticas
RLS continuam aplicadas às tabelas e ao Storage. A chave de IA fica exclusivamente nos segredos
do Supabase.

As rotas incluem login, cadastro, área protegida com abas Notas/Escanear/Resumo/Perfil e detalhes
da nota. O cache é invalidado nas mutações, e os dados do React Query são apagados ao sair da
conta.

## 2. Registro de Prompts Utilizados

### Prompt inicial solicitado

> Atuar como engenheiro sênior React Native/Expo/TypeScript/Supabase/Anthropic e construir o
> ScanIA do zero seguindo o PDF fornecido: configurar projeto e dependências, implementar banco
> e RLS, lógica e 36 testes, serviços e hooks, componentes e telas, autenticação protegida,
> Edge Function simulada/real, README personalizado, relatório técnico, executar typecheck,
> testes e formatação e publicar no GitHub sem enviar segredos.

### Instruções operacionais aplicadas no desenvolvimento

- Ler o PDF e conferir a estrutura do projeto antes de modificar arquivos.
- Inicializar o template TypeScript e migrar a entrada para Expo Router, mantendo o código de
  rotas na pasta `app/`.
- Implementar as funções puras e validar a extração de OCR sem confiar diretamente na resposta
  da IA.
- Executar `npm run typecheck`, `npm test` e a validação de configuração Expo; corrigir erros
  antes da formatação final.
- Conferir `.env`/`.env.example`, o estado do Git, e não incluir credenciais no código.

### Comandos relevantes executados

```text
npx create-expo-app@latest . --template blank-typescript --yes
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar react-dom react-native-web @expo/vector-icons react-native-svg @react-native-async-storage/async-storage expo-image-picker expo-image-manipulator
npm install @supabase/supabase-js @tanstack/react-query react-hook-form zod @hookform/resolvers react-native-url-polyfill base64-arraybuffer
npm install --save-dev jest-expo jest @types/jest prettier
npx expo install --fix
npx expo install expo-font
npm run typecheck
npm test -- --runInBand
npx expo config --type public
npx expo-doctor
npx expo export --platform android
```

## 3. Log Detalhado de Erros, Respostas das IAs e Soluções Implementadas

### 3.1 Extração do PDF no ambiente

- **Sintoma / mensagem:** `Python não foi encontrado; executar sem argumentos para instalar este
atalho da Microsoft Store...`
- **Arquivo(s) afetado(s):** PDF de referência; nenhum arquivo da aplicação.
- **Diagnóstico:** o alias `python` estava presente, mas o interpretador Python não estava
  instalado. O leitor de arquivos também não abre o PDF binário diretamente.
- **Solução:** usar `pdfjs-dist` instalado temporariamente fora do projeto e Node.js para extrair
  o texto das 89 páginas. O parser emitiu duas advertências de fonte (`Warning: TT: undefined
function: 21`); elas não impediram a extração. Os arquivos foram reconstruídos e revisados em
  TypeScript/SQL legíveis, em vez de copiar espaços e pontuação defeituosos do OCR.

### 3.2 Instalação de dependências

- **Sintoma / mensagem:** não houve `ERESOLVE`; os comandos de instalação terminaram com sucesso.
  O npm informou `22 moderate severity vulnerabilities` e avisos de depreciação para
  `inflight`, `glob` e `whatwg-encoding`.
- **Arquivo(s) afetado(s):** `package.json` e `package-lock.json`.
- **Diagnóstico:** avisos da árvore transitiva de dependências, não conflito que impedisse a
  instalação. O template inicial também tinha somente `expo start`, `android`, `ios` e `web`.
- **Solução:** deixar as versões nativas alinhadas ao SDK 58 via `npx expo install`, incluir
  dependências de desenvolvimento exigidas, scripts e Jest. Não executar `npm audit fix
--force`, que poderia introduzir atualizações incompatíveis. A contagem de avisos é
  informativa e deve ser reavaliada antes de uma publicação de produção.

### 3.3 Peer dependency do Expo

- **Sintoma / mensagem:** `Missing peer dependency: expo-font. Required by: @expo/vector-icons`.
- **Arquivo(s) afetado(s):** dependências e configuração do aplicativo.
- **Diagnóstico:** a verificação `npx expo-doctor` detectou uma peer dependency nativa não
  instalada diretamente.
- **Solução:** executar `npx expo install expo-font`; a execução seguinte do Expo Doctor passou
  em 20/20 verificações.

### 3.4 Primeira verificação TypeScript

- **Sintoma / mensagens exatas:**

  ```text
  __tests__/summary.test.ts(6,5): error TS2783: 'id' is specified more than once, so this usage will be overwritten.
  app/(app)/(tabs)/_layout.tsx(9,39): error TS2322: Type '____ColorValue_Internal' is not assignable to type 'string | NativeColorValue | undefined'.
  app/(app)/receipt/[id].tsx(41,25): error TS2345: Argument of type 'Receipt | undefined' is not assignable to parameter of type 'Pick<Receipt, "id" | "image_path">'.
  app/(app)/receipt/[id].tsx(52,22): error TS18048: 'receipt' is possibly 'undefined'.
  ```

- **Arquivo(s) afetado(s):** `__tests__/summary.test.ts`,
  `app/(app)/(tabs)/_layout.tsx` e `app/(app)/receipt/[id].tsx`.
- **Diagnóstico:** a fixture repetia `id` ao aplicar o objeto parcial; o tipo de cor da navegação
  é mais amplo que o aceito pelo ícone; o TypeScript não preservou o estreitamento do objeto
  opcional dentro dos callbacks.
- **Solução:** separar `id` do restante das sobreposições da fixture, normalizar a cor antes de
  passá-la a Ionicons e capturar a nota já validada em uma constante antes dos callbacks.

### 3.5 Iterações adicionais do tipo de cor

- **Sintoma / mensagens exatas:** a tentativa com `string` gerou TS2322 nos quatro ícones das
  abas (linhas 21, 22, 25 e 27), por incompatibilidade de parâmetro com o tipo interno do Expo:

  ```text
  app/(app)/(tabs)/_layout.tsx(21,60): error TS2322: Type '({ color, size }: { color: string; size: number; }) => JSX.Element' is not assignable to type '(props: { focused: boolean; color: ____ColorValue_Internal; size: number; }) => ReactNode'.
  ```

  A tentativa seguinte com `ColorValue` gerou:

  ```text
  app/(app)/(tabs)/_layout.tsx(9,39): error TS2322: Type 'string | number | NativeColorValue' is not assignable to type 'string | NativeColorValue | undefined'.
  Type 'number' is not assignable to type 'string | NativeColorValue | undefined'.
  ```

- **Arquivo(s) afetado(s):** `app/(app)/(tabs)/_layout.tsx`.
- **Diagnóstico:** o tipo React Native permite cores numéricas, enquanto a prop de cor do
  componente Ionicons não permite esse caso.
- **Solução:** usar `ColorValue` na entrada da função da aba e escolher `colors.primary` como
  alternativa quando o valor recebido não for uma string. A verificação final foi executada
  novamente após essa correção.

### 3.6 Checagem de tipos da Edge Function

- **Sintoma / mensagem exata:** a primeira execução de `npx --yes deno check
supabase/functions/scan-receipt/index.ts` falhou:

  ```text
  TS18046 [ERROR]: 'data.content' is of type 'unknown'.
    const block = data.content.find(
                  ~~~~~~~~~~~~
  ```

- **Arquivo(s) afetado(s):** `supabase/functions/scan-receipt/index.ts`.
- **Diagnóstico:** a resposta JSON da API Anthropic não tem um tipo confiável na fronteira de
  rede, então o TypeScript exige estreitar `content` antes de percorrer seus blocos.
- **Solução:** validar que `content` é um array e usar um type guard para aceitar somente um
  bloco de ferramenta com `input`. A execução posterior de `deno check` terminou sem erros.

### 3.7 Testes e configuração Expo

- **Sintoma / mensagem:** nenhuma falha Jest. A primeira verificação do Expo Doctor informou
  `Missing peer dependency: expo-font`; após instalar a dependência, a verificação passou em
  20/20. `npx expo config --type public` resolveu a configuração e os identificadores nativos.
- **Arquivo(s) afetado(s):** `__tests__/money.test.ts`, `date.test.ts`, `summary.test.ts`,
  `parse.test.ts` e `app.json`.
- **Diagnóstico:** os testes puros cobrem parsing/formatação de moeda, datas e meses,
  agregação mensal e validação defensiva de dados de OCR.
- **Solução:** manter as quatro suítes independentes; comparar explicitamente as categorias do
  app com a lista da Edge Function e executar novamente após as correções TypeScript.

## 4. Validação Final e Resultados dos Testes

Resultados observados após as correções:

| Comando                                                         | Resultado                                                                                               |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`                                             | Sucesso; `tsc --noEmit` terminou sem mensagens de erro                                                  |
| `npm test`                                                      | `Test Suites: 4 passed, 4 total`; `Tests: 36 passed, 36 total`                                          |
| `npm run format`                                                | Sucesso; Prettier formatou os arquivos de app, src, testes, função, configuração e documentação         |
| `npx expo-doctor`                                               | 20/20 verificações passaram após instalar `expo-font`                                                   |
| `npx expo config --type public`                                 | Configuração resolveu com SDK 58 e IDs `com.kathiamf.scania`                                            |
| `npx --yes deno check supabase/functions/scan-receipt/index.ts` | Sucesso após estreitar o JSON da API                                                                    |
| `npx expo export --platform android`                            | Bundle Android concluído (1.559 módulos); foram usadas variáveis Supabase fictícias somente no processo |

A configuração do backend, chamadas reais à Anthropic, câmera e publicação remota exigem
credenciais/serviços externos do proprietário e não são substituídos por uma validação local de
tipos ou testes unitários.
