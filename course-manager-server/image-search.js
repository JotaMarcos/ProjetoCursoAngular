// Busca automática de imagem para um curso usando a API pública da Wikipedia (sem chave).
// Política da Wikimedia: identificar o cliente no User-Agent e evitar rajadas de requisições.

const DEFAULT_IMAGE = '/assets/images/default-course.svg';
const USER_AGENT = 'course-manager-server/1.1 (https://github.com/JotaMarcos/ProjetoCursoAngular)';
const WIKIS = ['pt', 'en'];
const TIMEOUT_MS = 6000;
// Desambiguações aceitas: "Python (programming language)" sim, "Python (gênero)" não.
const TECH_QUALIFIER = /software|program|framework|language|linguagem|biblioteca|library|computa|database|banco de dados|operating system|sistema operacional/;
const ALLOWED_IMAGE_HOSTS = ['upload.wikimedia.org', 'thumb.wikimedia.org'];

const cache = new Map();

const normalize = text => text
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .toLowerCase();

const words = text => normalize(text).split(/[^a-z0-9.+#]+/).filter(Boolean);

// Palavras comuns em nomes de curso que não são o assunto: sem isso, "Introdução ao Python"
// casaria com o artigo "Introdução" e "Curso de Java" com o artigo "Curso".
const GENERIC_WORDS = new Set(words(
  'a o e as os ao aos de do da dos das em no na com para por um uma ' +
  'curso cursos introducao intro fundamentos basico basicos avancado avancada intermediario ' +
  'iniciante iniciantes completo completa pratico pratica essencial essenciais guia aprenda aprendendo ' +
  'modulo parte nivel zero bootcamp workshop treinamento masterclass formacao teste test'
));

const isGeneric = word => GENERIC_WORDS.has(words(word)[0] ?? '');
const withoutGenericWords = text => text.split(/\s+/).filter(word => word && !isGeneric(word)).join(' ');

// "Angular: Signals" -> ["Angular Signals", "Angular"]; "Introdução ao Python" -> ["Python"]
function buildQueries(courseName) {
  const full = withoutGenericWords(courseName.replace(/[:|\-–]+/g, ' '));
  const main = withoutGenericWords(courseName.split(/[:|\-–]/)[0]);
  const firstWord = main.split(' ')[0];
  return [...new Set([full, main, firstWord].filter(Boolean))];
}

const containsSequence = (haystack, needle) => needle.length > 0 &&
  haystack.some((_, i) => needle.every((word, j) => haystack[i + j] === word));

// Pontua o quanto o artigo é "o assunto" do curso: 0 = descartar, 1 = relevante, 2 = relevante e de tecnologia.
// O título (sem o parêntese) precisa aparecer inteiro no nome do curso: "Spring Boot" ⊂ "Java Spring Boot",
// mas "Monty Python" ⊄ "Python para Iniciantes" e "Angular momentum" ⊄ "Angular Signals".
function relevanceScore(pageTitle, query) {
  const match = pageTitle.match(/^(.*?)\s*\((.+)\)$/);
  const base = match ? match[1] : pageTitle;
  const qualifier = match ? normalize(match[2]) : null;

  if (!containsSequence(words(query), words(base)) || words(base).every(word => GENERIC_WORDS.has(word))) {
    return 0;
  }
  if (qualifier) {
    return TECH_QUALIFIER.test(qualifier) ? 2 : 0;
  }
  return 1;
}

function sanitizeImageUrl(source) {
  try {
    const url = new URL(source);
    if (url.protocol !== 'https:' || !ALLOWED_IMAGE_HOSTS.includes(url.hostname)) {
      return null;
    }
    url.search = '';
    return url.toString();
  } catch {
    return null;
  }
}

async function searchWiki(wiki, query, fetchImpl, signal) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    generator: 'search',
    gsrsearch: query,
    gsrlimit: '10',
    prop: 'pageimages',
    piprop: 'thumbnail',
    pithumbsize: '200'
  });

  const response = await fetchImpl(`https://${wiki}.wikipedia.org/w/api.php?${params}`, {
    headers: { 'User-Agent': USER_AGENT, 'Api-User-Agent': USER_AGENT },
    signal
  });
  if (!response.ok) {
    throw new Error(`Wikipedia respondeu ${response.status}`);
  }

  const data = await response.json();
  let best = null;
  for (const page of Object.values(data?.query?.pages ?? {}).sort((a, b) => a.index - b.index)) {
    const url = page.thumbnail?.source && sanitizeImageUrl(page.thumbnail.source);
    const score = url ? relevanceScore(page.title, query) : 0;
    if (score > (best?.score ?? 0)) {
      best = { url, score };
    }
  }
  return best;
}

async function findCourseImage(courseName, { fetchImpl = fetch } = {}) {
  const key = normalize(courseName).trim();
  if (cache.has(key)) {
    return cache.get(key);
  }

  const signal = AbortSignal.timeout(TIMEOUT_MS);
  let image = null;

  try {
    // Consultas em sequência (não em paralelo) para não gerar rajadas na API.
    // Para cada termo compara pt e en e fica com o melhor; só tenta o próximo termo se nada servir.
    for (const query of buildQueries(courseName)) {
      let best = null;
      for (const wiki of WIKIS) {
        const found = await searchWiki(wiki, query, fetchImpl, signal);
        if (found && found.score > (best?.score ?? 0)) {
          best = found;
        }
      }
      if (best) {
        image = best.url;
        break;
      }
    }
  } catch (err) {
    console.warn(`Busca de imagem falhou para "${courseName}": ${err.message}`);
    return DEFAULT_IMAGE; // falha temporária: não guarda no cache
  }

  image = image || DEFAULT_IMAGE;
  cache.set(key, image);
  return image;
}

module.exports = { findCourseImage, buildQueries, relevanceScore, sanitizeImageUrl, DEFAULT_IMAGE };
