#!/usr/bin/env bash
# Teste de fumaça da API do Course Manager.
# Uso (com a API rodando):  bash scripts/smoke-test.sh
# Outra URL:                API_URL=http://127.0.0.1:4000/api/courses bash scripts/smoke-test.sh

BASE="${API_URL:-http://127.0.0.1:3100/api/courses}"
ORIGIN_OK="${APP_ORIGIN:-http://localhost:4200}"
BODY="$(mktemp)"
HEADERS="$(mktemp)"
trap 'rm -f "$BODY" "$HEADERS"' EXIT

PASS=0
FAIL=0
GREEN=$'\e[32m'; RED=$'\e[31m'; BOLD=$'\e[1m'; RESET=$'\e[0m'

ok()   { PASS=$((PASS + 1)); printf "  ${GREEN}OK${RESET}     %s\n" "$1"; }
fail() { FAIL=$((FAIL + 1)); printf "  ${RED}FALHA${RESET}  %s\n         %s\n" "$1" "$2"; }

# request MÉTODO CAMINHO [CORPO] [cabeçalhos extras...] -> status HTTP; corpo em $BODY e cabeçalhos em $HEADERS
# O corpo vai pela entrada padrão (@-): no Git Bash para Windows, acentos passados como argumento
# para o curl.exe chegam corrompidos ("Introdução" vira "Introdu��o").
request() {
  local method="$1" path="$2" data="$3"; shift 3
  local args=(-s -o "$BODY" -D "$HEADERS" -w '%{http_code}' -X "$method" "$@")
  if [ -n "$data" ]; then
    printf '%s' "$data" | curl "${args[@]}" -H 'Content-Type: application/json' --data-binary @- "$BASE$path"
  else
    curl "${args[@]}" "$BASE$path"
  fi
}

expect_status() { # descrição esperado obtido
  if [ "$3" = "$2" ]; then ok "$1 → $3"; else fail "$1" "esperado HTTP $2, recebido $3: $(head -c 200 "$BODY")"; fi
}

# Lê um campo do JSON da última resposta (sem depender do jq).
field() { node -e 'const o=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));const v=process.argv[2].split(".").reduce((a,k)=>a?.[k],o);console.log(v===undefined?"":v)' "$BODY" "$1"; }
header() { grep -i "^$1:" "$HEADERS" | head -1 | cut -d' ' -f2- | tr -d '\r'; }

printf "${BOLD}Course Manager · teste de fumaça da API${RESET}\nAlvo: %s\n" "$BASE"

if ! curl -s -o /dev/null --max-time 3 "$BASE"; then
  printf "${RED}A API não respondeu em %s.${RESET} Inicie com: npm run server\n" "$BASE"
  exit 2
fi

echo; echo "${BOLD}1. Leitura${RESET}"
status=$(request GET "" "")
expect_status "GET /courses lista os cursos" 200 "$status"
count=$(field length)
[ "$count" -ge 1 ] 2>/dev/null && ok "lista contém $count curso(s)" || fail "lista de cursos" "nenhum curso retornado"

expect_status "GET /courses/1 existente" 200 "$(request GET /1 "")"
expect_status "GET /courses/999999 inexistente" 404 "$(request GET /999999 "")"
expect_status "GET /courses/abc id inválido" 400 "$(request GET /abc "")"

echo; echo "${BOLD}2. Cadastro (POST)${RESET}"
status=$(request POST "" '{"name":"Introdução ao Python","description":"Criado pelo smoke test","price":19.9,"rating":4,"id":999,"isAdmin":true}')
expect_status "POST curso válido" 201 "$status"
NEW_ID=$(field id)
[ -n "$NEW_ID" ] && [ "$NEW_ID" != "999" ] && ok "id gerado pelo servidor ($NEW_ID), id do cliente ignorado" || fail "id gerado pelo servidor" "id recebido: '$NEW_ID'"
[ -z "$(field isAdmin)" ] && ok "campo extra 'isAdmin' descartado" || fail "whitelist de campos" "isAdmin foi gravado"
IMAGE=$(field imageUrl)
[ -n "$IMAGE" ] && ok "imagem preenchida automaticamente: $IMAGE" || fail "busca automática de imagem" "imageUrl vazio"

expect_status "POST sem campos obrigatórios" 400 "$(request POST "" '{"name":"Incompleto"}')"
expect_status "POST com preço em texto" 400 "$(request POST "" '{"name":"X","description":"d","price":"10","rating":3}')"
expect_status "POST com imageUrl javascript:" 400 "$(request POST "" '{"name":"X","description":"d","price":1,"rating":3,"imageUrl":"javascript:alert(1)"}')"

status=$(request POST "" '{json-quebrado')
expect_status "POST com JSON malformado" 400 "$status"
grep -q 'at .*\.js' "$BODY" && fail "erro sem stack trace" "a resposta expõe stack trace" || ok "erro não expõe stack trace"

big=$(printf '%*s' 20000 '' | tr ' ' 'a')
expect_status "POST acima de 10 KB" 413 "$(request POST "" "{\"name\":\"X\",\"description\":\"$big\",\"price\":1,\"rating\":3}")"

echo; echo "${BOLD}3. Edição (PUT)${RESET}"
status=$(request PUT "/$NEW_ID" '{"name":"Introdução ao Python: Editado","description":"Editado","price":29.9,"rating":5,"id":1}')
expect_status "PUT /courses/$NEW_ID" 200 "$status"
[ "$(field id)" = "$NEW_ID" ] && ok "id mantido da URL ($NEW_ID), id do corpo ignorado" || fail "id no PUT" "id virou $(field id)"
[ "$(field name)" = "Introdução ao Python: Editado" ] && ok "nome atualizado" || fail "nome no PUT" "$(field name)"
expect_status "PUT em id inexistente" 404 "$(request PUT /999999 '{"name":"X","description":"d","price":1,"rating":3}')"

echo; echo "${BOLD}4. Exclusão (DELETE)${RESET}"
expect_status "DELETE /courses/$NEW_ID" 204 "$(request DELETE "/$NEW_ID" "")"
expect_status "DELETE repetido" 404 "$(request DELETE "/$NEW_ID" "")"

echo; echo "${BOLD}5. Segurança HTTP${RESET}"
request GET "" "" -H "Origin: $ORIGIN_OK" > /dev/null
[ "$(header access-control-allow-origin)" = "$ORIGIN_OK" ] && ok "CORS libera $ORIGIN_OK" || fail "CORS origem permitida" "cabeçalho: '$(header access-control-allow-origin)'"
request GET "" "" -H "Origin: http://site-malicioso.example" > /dev/null
[ -z "$(header access-control-allow-origin)" ] && ok "CORS bloqueia origem desconhecida" || fail "CORS origem bloqueada" "liberou: $(header access-control-allow-origin)"
[ -z "$(header x-powered-by)" ] && ok "X-Powered-By ausente" || fail "X-Powered-By" "presente: $(header x-powered-by)"
[ "$(header x-content-type-options)" = "nosniff" ] && ok "X-Content-Type-Options: nosniff" || fail "X-Content-Type-Options" "'$(header x-content-type-options)'"
[ -n "$(header content-security-policy)" ] && ok "Content-Security-Policy presente" || fail "Content-Security-Policy" "ausente"
[ -n "$(header ratelimit-policy)" ] && ok "rate limit ativo ($(header ratelimit-policy))" || fail "rate limit" "cabeçalho RateLimit-Policy ausente"

echo
TOTAL=$((PASS + FAIL))
if [ "$FAIL" -eq 0 ]; then
  printf "${GREEN}${BOLD}Resultado: %d/%d verificações OK${RESET}\n" "$PASS" "$TOTAL"
else
  printf "${RED}${BOLD}Resultado: %d falha(s) em %d verificações${RESET}\n" "$FAIL" "$TOTAL"
fi
exit $((FAIL > 0))
