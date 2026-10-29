# 🧪 Roteiro de testes — Course Manager (Git Bash)

Este roteiro guia você, passo a passo, na validação completa da aplicação pelo **terminal do Git Bash** no Windows: instalação, testes automatizados, testes da API com `curl`, testes da interface no navegador e build de produção.

Cada teste tem um **ID**, o **comando** e o **resultado esperado**. Marque `[x]` no que passar e anote o que falhar na [tabela de resultados](#-registro-de-resultados) ao final.

| | |
|---|---|
| ⏱ **Duração** | ~30 minutos (≈10 min se fizer só as etapas 2 e 4) |
| 🖥 **Terminais** | 3 janelas do Git Bash — chamadas de **T1**, **T2** e **T3** |
| 🌐 **Internet** | Necessária para instalar dependências e para a busca de imagem (API-05) |

---

## Sumário

0. [Preparação do ambiente](#0-preparação-do-ambiente)
1. [Instalação](#1-instalação)
2. [Testes automatizados](#2-testes-automatizados)
3. [Subir a API](#3-subir-a-api-t1)
4. [Teste de fumaça automatizado](#4-teste-de-fumaça-automatizado-t3)
5. [Testes manuais da API](#5-testes-manuais-da-api-t3)
6. [Configurações da API](#6-configurações-da-api-t1--t3)
7. [Testes da interface](#7-testes-da-interface-t2--navegador)
8. [Build de produção](#8-build-de-produção-t3)
9. [Encerramento](#9-encerramento)
10. [Solução de problemas](#-solução-de-problemas)

---

## 0. Preparação do ambiente

**Abra o Git Bash:** menu Iniciar → digite `Git Bash` → Enter. Ou, no Explorador de Arquivos, clique com o botão direito na pasta do projeto → **Open Git Bash here**.

> 💡 No Git Bash, **colar** é `Shift + Insert` (ou botão direito → *Paste*) e **copiar** é só selecionar o texto com o mouse. `Ctrl + C` **interrompe** o comando em execução.

### PRE-01 · Verificar as ferramentas

```bash
node -v
npm -v
git --version
curl --version | head -1
```

**Esperado:**
- [ ] `node` → `v20.19` ou superior, `v22.12` ou superior, ou `v24` ou superior
- [ ] `npm` → `10` ou superior
- [ ] `git` e `curl` exibem uma versão (qualquer uma)

> ❌ Se `node` não for encontrado, instale o Node.js LTS em https://nodejs.org e **abra um novo** Git Bash.

### PRE-02 · Verificar se as portas estão livres

A API usa a porta **3100** e o app usa a **4200**.

```bash
netstat -ano | grep -E ':(3100|4200) ' | grep LISTENING
```

**Esperado:**
- [ ] Nenhuma linha exibida. Se aparecer alguma, veja [Porta já em uso](#porta-já-em-uso-eaddrinuse).

---

## 1. Instalação

Execute no **T1**.

### INS-01 · Obter o projeto

Se ainda não tem o projeto na máquina:

```bash
git clone https://github.com/JotaMarcos/ProjetoCursoAngular.git
cd ProjetoCursoAngular
```

Se já tem, entre na pasta e atualize:

```bash
cd /c/workspace/ProjetoCursoAngular   # ajuste para o seu caminho
git checkout master
git pull
```

> 💡 No Git Bash, `C:\workspace` se escreve `/c/workspace`.

**Esperado:**
- [ ] `ls` mostra `angular.json`, `package.json`, `src/` e `course-manager-server/`

### INS-02 · Instalar as dependências

```bash
npm ci
cd course-manager-server && npm ci && cd ..
```

**Esperado:**
- [ ] Ambos terminam com `found 0 vulnerabilities`
- [ ] Nenhuma linha começando com `npm error`

---

## 2. Testes automatizados

Execute no **T1**, na raiz do projeto.

### AUT-01 · Testes do frontend (Angular + Vitest)

```bash
npm test -- --watch=false
```

**Esperado:**
- [ ] `Test Files  9 passed (9)`
- [ ] `Tests  20 passed (20)`

### AUT-02 · Testes da API (node:test)

```bash
npm run test:server
```

**Esperado:**
- [ ] `# pass 26`
- [ ] `# fail 0`

> 💡 Esses testes **não precisam** da API rodando nem de internet: as chamadas à Wikipedia são simuladas.

---

## 3. Subir a API (T1)

```bash
npm run server
```

**Esperado:**
- [ ] `API-00` · Aparece `Server started at http://127.0.0.1:3100`

⚠️ **Deixe o T1 aberto.** A API fica rodando nele até a [etapa 9](#9-encerramento).

---

## 4. Teste de fumaça automatizado (T3)

Abra um **novo** Git Bash (T3), entre na pasta do projeto e rode:

```bash
cd /c/workspace/ProjetoCursoAngular   # ajuste para o seu caminho
bash scripts/smoke-test.sh
```

O script executa 27 verificações na API — leitura, cadastro, validação, edição, exclusão e segurança — e cria e remove o próprio curso de teste.

**Esperado:**
- [ ] `SMK-01` · Todas as linhas com `OK` em verde
- [ ] `SMK-02` · Última linha: `Resultado: 27/27 verificações OK`

> 💡 Se tiver pressa, as etapas 2 e 4 já validam o essencial. As etapas seguintes mostram cada comportamento em detalhe.

---

## 5. Testes manuais da API (T3)

### Preparação do terminal

Cole no T3 os dois comandos abaixo. Eles valem **apenas para esta janela** — se abrir outra, cole de novo.

```bash
API=http://127.0.0.1:3100/api/courses
json() { node -e 'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>{try{console.log(JSON.stringify(JSON.parse(s),null,2))}catch{console.log(s)}})'; }
```

- `API` guarda o endereço da API.
- `json` formata as respostas para leitura (o Git Bash não traz o `jq`).

> ⚠️ **Acentos no Git Bash:** JSON com acentos passado com `-d '...'` chega **corrompido** à API (`Introdução` vira `Introdu��o`). Por isso este roteiro envia o corpo pela entrada padrão, com `--data-binary @-` e um bloco `<<'EOF' ... EOF`. Copie esses blocos **inteiros**, até a linha `EOF`.

### 5.1 Leitura

#### API-01 · Listar todos os cursos

```bash
curl -s "$API" | json
```

- [ ] Lista com **5 cursos**: Angular: CLI, Forms, HTTP, Router e Animations

#### API-02 · Buscar um curso pelo id

```bash
curl -s "$API/1" | json
```

- [ ] Retorna somente o curso `"id": 1`, `"name": "Angular: CLI"`

#### API-03 · Curso inexistente

```bash
curl -s -i "$API/999" | head -1
```

- [ ] `HTTP/1.1 404 Not Found`

#### API-04 · Id inválido

```bash
curl -s -i "$API/abc" | head -1
```

- [ ] `HTTP/1.1 400 Bad Request`

### 5.2 Cadastro

#### API-05 · Cadastrar um curso (com imagem automática)

```bash
curl -s -X POST "$API" -H 'Content-Type: application/json' --data-binary @- <<'EOF' | json
{
  "name": "Introdução ao Python",
  "description": "Fundamentos da linguagem Python",
  "price": 49.9,
  "rating": 4.5
}
EOF
```

- [ ] `"id": 6` gerado pelo servidor
- [ ] Acentos corretos: `"name": "Introdução ao Python"`
- [ ] `"imageUrl"` preenchido com uma URL `https://...wikimedia.org/...Python-logo...` (pode levar até 2 segundos)

> 💡 Sem internet, o `imageUrl` será `/assets/images/default-course.svg` — também é um resultado **correto**: o cadastro nunca falha por causa da imagem.

#### API-06 · Campos obrigatórios ausentes

```bash
curl -s -X POST "$API" -H 'Content-Type: application/json' --data-binary @- <<'EOF' | json
{ "name": "Curso incompleto" }
EOF
```

- [ ] Retorna `"errors"` listando `description`, `price` e `rating` como obrigatórios

#### API-07 · Tipo inválido e URL maliciosa

```bash
curl -s -X POST "$API" -H 'Content-Type: application/json' --data-binary @- <<'EOF' | json
{ "name": "X", "description": "d", "price": "dez", "rating": 9, "imageUrl": "javascript:alert(1)" }
EOF
```

- [ ] `"errors"` aponta `price` (não é número), `rating` (fora de 0 a 5) e `imageUrl` (inválido)

#### API-08 · Campos extras são descartados

```bash
curl -s -X POST "$API" -H 'Content-Type: application/json' --data-binary @- <<'EOF' | json
{ "name": "Docker", "description": "Containers", "price": 10, "rating": 3, "id": 999, "isAdmin": true }
EOF
```

- [ ] O `id` retornado **não** é `999` (é o próximo da sequência, ex.: `7`)
- [ ] **Não** existe o campo `isAdmin` na resposta

#### API-09 · JSON malformado

```bash
echo '{json quebrado' | curl -s -i -X POST "$API" -H 'Content-Type: application/json' --data-binary @- | sed -n '1p;$p'; echo
```

- [ ] Primeira linha: `HTTP/1.1 400 Bad Request`
- [ ] Última linha: `{"error":"Requisição inválida."}` — **sem** caminhos de arquivo ou stack trace

#### API-10 · Corpo acima do limite (10 KB)

```bash
printf '{"name":"X","description":"%s","price":1,"rating":3}' "$(printf '%*s' 20000 '' | tr ' ' a)" \
  | curl -s -o /dev/null -w "%{http_code}\n" -X POST "$API" -H 'Content-Type: application/json' --data-binary @-
```

- [ ] `413`

### 5.3 Edição

#### API-11 · Atualizar o curso criado

Use o `id` retornado no API-05 (normalmente `6`).

```bash
curl -s -X PUT "$API/6" -H 'Content-Type: application/json' --data-binary @- <<'EOF' | json
{
  "name": "Introdução ao Python — Turma 2",
  "description": "Fundamentos da linguagem Python",
  "price": 59.9,
  "rating": 5,
  "id": 1
}
EOF
```

- [ ] `"name"` e `"price"` atualizados
- [ ] `"id": 6` — o `id` enviado no corpo (`1`) é **ignorado**
- [ ] `"imageUrl"` mantido do cadastro

#### API-12 · Atualizar curso inexistente

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X PUT "$API/999" -H 'Content-Type: application/json' --data-binary @- <<'EOF'
{ "name": "X", "description": "d", "price": 1, "rating": 3 }
EOF
```

- [ ] `404`

### 5.4 Exclusão

#### API-13 · Excluir e tentar excluir de novo

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X DELETE "$API/6"
curl -s -o /dev/null -w "%{http_code}\n" -X DELETE "$API/6"
```

- [ ] Primeira linha `204` (excluído)
- [ ] Segunda linha `404` (já não existe)

### 5.5 Segurança HTTP

#### API-14 · CORS

```bash
echo "--- origem do app:";       curl -s -I -H "Origin: http://localhost:4200" "$API" | grep -i access-control-allow-origin
echo "--- origem desconhecida:"; curl -s -I -H "Origin: http://site-malicioso.example" "$API" | grep -i access-control-allow-origin || echo "(bloqueada)"
```

- [ ] Origem do app: `Access-Control-Allow-Origin: http://localhost:4200`
- [ ] Origem desconhecida: `(bloqueada)`

#### API-15 · Cabeçalhos de segurança

```bash
curl -s -I "$API" | grep -iE 'x-powered-by|x-content-type-options|content-security-policy|x-frame-options|ratelimit-policy'
```

- [ ] Aparecem `X-Content-Type-Options: nosniff`, `Content-Security-Policy`, `X-Frame-Options` e `RateLimit-Policy`
- [ ] **Não** aparece `X-Powered-By`

---

## 6. Configurações da API (T1 + T3)

Estes testes reiniciam a API com variáveis de ambiente.

#### CFG-01 · Limite de requisições (rate limit)

No **T1**, pare a API com `Ctrl + C` e suba com limite de 5 requisições por minuto:

```bash
RATE_LIMIT_PER_MINUTE=5 npm run server
```

No **T3**:

```bash
for i in $(seq 1 7); do curl -s -o /dev/null -w "%{http_code} " "$API"; done; echo
```

- [ ] `200 200 200 200 200 429 429` — a partir da 6ª requisição a API bloqueia

#### CFG-02 · Busca de imagem desligada

No **T1**, `Ctrl + C` e suba com:

```bash
IMAGE_SEARCH=off npm run server
```

No **T3**:

```bash
curl -s -X POST "$API" -H 'Content-Type: application/json' --data-binary @- <<'EOF' | json
{ "name": "Introdução ao Python", "description": "d", "price": 1, "rating": 3 }
EOF
```

- [ ] `"imageUrl": "/assets/images/default-course.svg"`

#### CFG-03 · Voltar ao normal

No **T1**, `Ctrl + C` e:

```bash
npm run server
```

- [ ] `Server started at http://127.0.0.1:3100`

> 💡 A API guarda os dados **em memória**: cada reinício volta aos 5 cursos iniciais.

---

## 7. Testes da interface (T2 + navegador)

Abra um novo Git Bash (**T2**) e suba o app:

```bash
cd /c/workspace/ProjetoCursoAngular   # ajuste para o seu caminho
npm start
```

- [ ] `UI-00` · Aparece `Local:   http://localhost:4200/` (a API precisa continuar rodando no T1)

Abra **http://localhost:4200** no navegador.

| ID | Ação | Resultado esperado | ✓ |
|---|---|---|:---:|
| UI-01 | Acessar `http://localhost:4200` | Redireciona para `/courses` e mostra a lista com 5 cursos, imagens e estrelas | [ ] |
| UI-02 | Digitar `forms` no campo **Filter By** | Fica só **Angular: Forms**. Apagar o texto volta os 5 | [ ] |
| UI-03 | Conferir as notas | Animations com 5 estrelas, Router com 4 e meia, Forms com 3 e meia | [ ] |
| UI-04 | Clicar em **Cadastrar** | Abre **Cadastrar Curso**, formulário vazio, aviso de imagem automática e **Save** desabilitado | [ ] |
| UI-05 | Clicar no campo Name e depois fora dele, sem digitar | Só então o campo fica vermelho com *Course name is required* | [ ] |
| UI-06 | Preencher Name `Introdução ao Python`, Price `49.9`, Rating `4.5`, Description `Teste` e clicar **Save** | Volta para a lista; o novo curso aparece **com o logo do Python** | [ ] |
| UI-07 | Clicar em **Editar** no curso criado, mudar o preço para `59.9` e **Save** | A lista mostra o preço novo; a imagem continua a mesma | [ ] |
| UI-08 | Clicar em **Editar** e depois em **Back** | Volta para a lista sem alterar nada | [ ] |
| UI-09 | Clicar em **Delete** no curso criado | O curso some da lista | [ ] |
| UI-10 | Acessar `http://localhost:4200/pagina-que-nao-existe` | Mostra **Error 404** | [ ] |
| UI-11 | `F12` → ícone de celular (*Toggle device toolbar*) → escolher um celular | Aparece o botão ☰; clicar nele abre e fecha o menu. A tabela rola para o lado e o **Cadastrar** fica visível | [ ] |
| UI-12 | `F12` → aba **Console**, recarregar a página | Nenhum erro em vermelho | [ ] |
| UI-13 | No **T1**, `Ctrl + C` (para a API) e recarregar a lista | A lista fica vazia e o Console mostra erro de conexão — comportamento esperado sem API. Suba a API de novo com `npm run server` | [ ] |

---

## 8. Build de produção (T3)

```bash
npm run build
ls dist/course-manager/browser
```

- [ ] `BLD-01` · Termina com `Application bundle generation complete`, sem `ERROR` ou `WARNING`
- [ ] `BLD-02` · A pasta contém `index.html`, `assets/` e arquivos `main-*.js` e `styles-*.css`

---

## 9. Encerramento

1. Nos terminais **T1** (API) e **T2** (app), pressione `Ctrl + C`.
2. Confirme que as portas foram liberadas:

```bash
netstat -ano | grep -E ':(3100|4200) ' | grep LISTENING || echo "portas livres"
```

- [ ] `FIM-01` · Exibe `portas livres`

---

## 🩺 Solução de problemas

### Porta já em uso (`EADDRINUSE`)

Algum processo antigo continua usando a porta. Descubra e finalize (troque `3100` por `4200` se for o app):

```bash
netstat -ano | grep ':3100 ' | grep LISTENING     # o número no fim da linha é o PID
taskkill //PID "$(netstat -ano | grep ':3100 ' | grep LISTENING | awk '{print $5}' | head -1)" //F
```

> No Git Bash as opções do `taskkill` usam **barra dupla** (`//PID`, `//F`); com barra simples o Git Bash as confunde com caminhos.

### `curl: (7) Failed to connect`

A API não está rodando. Confira o T1 e rode `npm run server`.

### Acentos aparecem como `Introdu��o`

O JSON foi enviado com `-d '...'`. Use o formato com `--data-binary @-` e o bloco `<<'EOF' ... EOF` deste roteiro. Reinicie a API para descartar os dados corrompidos.

### O comando fica "parado" esperando

Faltou colar a linha final `EOF` de um bloco. Digite `EOF` e Enter, ou cancele com `Ctrl + C`.

### `json: command not found`

A função foi definida em outra janela. Cole de novo os comandos da [preparação do terminal](#preparação-do-terminal).

### `bash: $'\r': command not found` ao rodar o script

O arquivo `.sh` foi salvo com quebras de linha do Windows. Corrija com:

```bash
sed -i 's/\r$//' scripts/smoke-test.sh
```

### A imagem do curso não é a esperada

A busca usa a Wikipedia e escolhe o artigo cujo título é o assunto do curso. Nomes de tecnologia (Python, Angular, Spring Boot, Node.js) trazem o logo; nomes genéricos podem trazer a imagem principal do artigo do tema, ou a imagem padrão. Detalhes no [README](../README.md#-imagem-automática-no-cadastro).

---

## 📋 Registro de resultados

| Campo | Valor |
|---|---|
| Testador | |
| Data | |
| Versão (`git log --oneline -1`) | |
| Node / npm | |

| Etapa | IDs | Resultado | Observações |
|---|---|:---:|---|
| Preparação | PRE-01 a PRE-02 | ☐ OK ☐ Falha | |
| Instalação | INS-01 a INS-02 | ☐ OK ☐ Falha | |
| Testes automatizados | AUT-01 a AUT-02 | ☐ OK ☐ Falha | |
| Teste de fumaça | SMK-01 a SMK-02 | ☐ OK ☐ Falha | |
| API — leitura | API-01 a API-04 | ☐ OK ☐ Falha | |
| API — cadastro | API-05 a API-10 | ☐ OK ☐ Falha | |
| API — edição e exclusão | API-11 a API-13 | ☐ OK ☐ Falha | |
| API — segurança | API-14 a API-15 | ☐ OK ☐ Falha | |
| Configurações | CFG-01 a CFG-03 | ☐ OK ☐ Falha | |
| Interface | UI-00 a UI-13 | ☐ OK ☐ Falha | |
| Build | BLD-01 a BLD-02 | ☐ OK ☐ Falha | |
| Encerramento | FIM-01 | ☐ OK ☐ Falha | |

Ao encontrar uma falha, registre: **ID do teste**, **comando executado**, **saída obtida** (copie do terminal) e **o que era esperado**. Abra uma *issue* em https://github.com/JotaMarcos/ProjetoCursoAngular/issues com essas informações.
