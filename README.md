# ProjetoCursoAngular — CourseManager

Aplicação Angular 21 (NgModules) para gerenciar cursos, com uma API REST em Express (`course-manager-server/`).

## Requisitos

- Node.js `^20.19`, `^22.12` ou `>=24`
- npm 10+

## Instalação

```bash
npm ci
npm ci --prefix course-manager-server
```

> Se for regenerar o `package-lock.json` do zero, use `npx npm@11 install`: o npm 10 tem um bug ao resolver os peer deps opcionais do Vitest (`Cannot read properties of null (reading 'edgesOut')`). Com o lockfile presente, `npm ci` funciona normalmente no npm 10.

## Executando localmente

Em dois terminais:

```bash
npm run server   # API em http://127.0.0.1:3100/api/courses
npm start        # App em http://localhost:4200/
```

Variáveis de ambiente da API (opcionais):

| Variável                | Padrão                  | Descrição                                   |
|-------------------------|-------------------------|---------------------------------------------|
| `PORT`                  | `3100`                  | Porta da API                                |
| `HOST`                  | `127.0.0.1`             | Interface de rede (use `0.0.0.0` para expor) |
| `CORS_ORIGINS`          | `http://localhost:4200` | Origens permitidas, separadas por vírgula   |
| `RATE_LIMIT_PER_MINUTE` | `300`                   | Requisições por IP por minuto               |
| `IMAGE_SEARCH`          | (ligado)                | `off` desliga a busca de imagem na web      |

### Imagem automática no cadastro

Ao cadastrar um curso sem imagem, a API busca uma na Wikipedia (pt e en, sem chave de API) a partir do nome do curso — por exemplo, "Python para Iniciantes" recebe o logo do Python. Se nada relevante for encontrado, ou se a busca falhar/estiver sem internet, o curso é salvo com `/assets/images/default-course.svg`. A lógica fica em `course-manager-server/image-search.js`.

## Build

```bash
npm run build    # saída em dist/course-manager
```

No build de produção a app chama a API em `/api` (mesma origem); configure um proxy reverso com HTTPS.

## Testes

```bash
npm test -- --watch=false   # testes unitários do Angular (Vitest + jsdom)
npm run test:server         # testes da API (node:test)
```
