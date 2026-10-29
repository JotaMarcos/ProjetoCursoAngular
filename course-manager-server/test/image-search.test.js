const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { findCourseImage, buildQueries, relevanceScore, sanitizeImageUrl, DEFAULT_IMAGE } = require('../image-search');

// Simula a API da Wikipedia: `results` mapeia "wiki|consulta" -> páginas retornadas.
function fakeFetch(results, calls = []) {
  return async url => {
    const parsed = new URL(url);
    const wiki = parsed.hostname.split('.')[0];
    const query = parsed.searchParams.get('gsrsearch');
    calls.push(`${wiki}|${query}`);
    const pages = results[`${wiki}|${query}`] || [];
    return {
      ok: true,
      json: async () => ({ query: { pages: Object.fromEntries(pages.map((p, index) => [index, { index, ...p }])) } })
    };
  };
}

const thumb = file => ({ source: `https://upload.wikimedia.org/${file}?utm_source=x` });

describe('image-search', () => {
  test('buildQueries usa nome completo, tecnologia principal e primeira palavra', () => {
    assert.deepEqual(buildQueries('Angular: Signals'), ['Angular Signals', 'Angular']);
    assert.deepEqual(buildQueries('Python para Iniciantes'), ['Python para Iniciantes', 'Python']);
    assert.deepEqual(buildQueries('Docker'), ['Docker']);
  });

  test('relevanceScore descarta artigos que não são o assunto do curso', () => {
    // Casos reais retornados pela Wikipedia que trariam imagem errada
    assert.equal(relevanceScore('Orbital angular momentum of light', 'Angular Signals'), 0);
    assert.equal(relevanceScore('Angular momentum', 'Angular Signals'), 0);
    assert.equal(relevanceScore('Ember.js', 'Angular CLI'), 0);
    assert.equal(relevanceScore('Monty Python', 'Python'), 0);
    assert.equal(relevanceScore('Python (gênero)', 'Python'), 0);
    assert.equal(relevanceScore('Python (missile)', 'Python'), 0);
  });

  test('relevanceScore aceita o assunto e prioriza desambiguação de tecnologia', () => {
    assert.equal(relevanceScore('Spring Boot', 'Java Spring Boot'), 1);
    assert.equal(relevanceScore('Culinária italiana', 'Culinaria Italiana'), 1);
    assert.equal(relevanceScore('Python (programming language)', 'Python'), 2);
    assert.equal(relevanceScore('Docker (software)', 'Docker'), 2);
  });

  test('prefere a linguagem de programação à cobra, mesmo vindo da wiki em inglês', async () => {
    const image = await findCourseImage('Python Teste', {
      fetchImpl: fakeFetch({
        'pt|Python': [{ title: 'Python (gênero)', thumbnail: thumb('cobra.jpg') }, { title: 'Python', thumbnail: thumb('python-pt.png') }],
        'en|Python': [{ title: 'Python (programming language)', thumbnail: thumb('python-logo.png') }]
      })
    });
    assert.equal(image, 'https://upload.wikimedia.org/python-logo.png');
  });

  test('sanitizeImageUrl aceita só HTTPS da Wikimedia e remove parâmetros de rastreio', () => {
    assert.equal(sanitizeImageUrl('https://upload.wikimedia.org/a.png?utm_source=x'), 'https://upload.wikimedia.org/a.png');
    assert.equal(sanitizeImageUrl('http://upload.wikimedia.org/a.png'), null);
    assert.equal(sanitizeImageUrl('https://evil.example/a.png'), null);
    assert.equal(sanitizeImageUrl('javascript:alert(1)'), null);
  });

  test('ignora resultado irrelevante e cai para a tecnologia principal', async () => {
    const calls = [];
    const image = await findCourseImage('Angular: Teste Fallback', {
      fetchImpl: fakeFetch({
        'pt|Angular Teste Fallback': [{ title: 'Orbital angular momentum', thumbnail: thumb('optica.jpg') }],
        'pt|Angular': [{ title: 'Angular (framework)', thumbnail: thumb('angular.png') }]
      }, calls)
    });

    assert.equal(image, 'https://upload.wikimedia.org/angular.png');
    assert.deepEqual(calls, ['pt|Angular Teste Fallback', 'en|Angular Teste Fallback', 'pt|Angular', 'en|Angular']);
  });

  test('usa cache para o mesmo nome', async () => {
    const calls = [];
    const fetchImpl = fakeFetch({ 'pt|Kotlin Cache': [{ title: 'Kotlin', thumbnail: thumb('kotlin.png') }] }, calls);

    const first = await findCourseImage('Kotlin Cache', { fetchImpl });
    const callsAfterFirst = calls.length;
    const second = await findCourseImage('kotlin cache', { fetchImpl });

    assert.equal(second, first);
    assert.equal(calls.length, callsAfterFirst);
  });

  test('retorna imagem padrão quando nada é encontrado', async () => {
    const image = await findCourseImage('Curso Sem Resultado', { fetchImpl: fakeFetch({}) });
    assert.equal(image, DEFAULT_IMAGE);
  });

  test('retorna imagem padrão quando a API falha (ex.: 429) sem quebrar o cadastro', async () => {
    const image = await findCourseImage('Curso Com Erro', { fetchImpl: async () => ({ ok: false, status: 429 }) });
    assert.equal(image, DEFAULT_IMAGE);
  });
});
