const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const { createApp } = require('../app');

const validCourse = {
  name: 'Angular: Signals',
  description: 'Curso de Signals.',
  price: 19.9,
  rating: 4
};

describe('API /api/courses', () => {
  let server;
  let baseUrl;

  let imageSearches;

  beforeEach(async () => {
    imageSearches = [];
    const findImage = async name => {
      imageSearches.push(name);
      return 'https://upload.wikimedia.org/fake.png';
    };
    server = createApp({ findImage }).listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}/api/courses`;
  });

  afterEach(() => new Promise(resolve => server.close(resolve)));

  const send = (method, path, body, headers = {}) => fetch(baseUrl + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body))
  });

  test('GET lista os cursos iniciais', async () => {
    const response = await fetch(baseUrl);
    assert.equal(response.status, 200);
    const courses = await response.json();
    assert.equal(courses.length, 5);
  });

  test('GET por id existente e inexistente', async () => {
    assert.equal((await fetch(`${baseUrl}/1`)).status, 200);
    assert.equal((await fetch(`${baseUrl}/999`)).status, 404);
    assert.equal((await fetch(`${baseUrl}/abc`)).status, 400);
  });

  test('POST cria curso com id gerado pelo servidor e descarta campos extras', async () => {
    const response = await send('POST', '', { ...validCourse, id: 42, isAdmin: true });
    assert.equal(response.status, 201);
    const created = await response.json();
    assert.equal(created.id, 6);
    assert.equal(created.isAdmin, undefined);
  });

  test('POST sem imageUrl busca a imagem pelo nome do curso', async () => {
    const created = await (await send('POST', '', validCourse)).json();
    assert.deepEqual(imageSearches, ['Angular: Signals']);
    assert.equal(created.imageUrl, 'https://upload.wikimedia.org/fake.png');
  });

  test('POST com imageUrl informada não faz busca', async () => {
    const created = await (await send('POST', '', { ...validCourse, imageUrl: '/assets/images/cli.png' })).json();
    assert.deepEqual(imageSearches, []);
    assert.equal(created.imageUrl, '/assets/images/cli.png');
  });

  test('POST rejeita payload inválido', async () => {
    assert.equal((await send('POST', '', { name: 'x' })).status, 400);
    assert.equal((await send('POST', '', { ...validCourse, price: '10' })).status, 400);
    assert.equal((await send('POST', '', { ...validCourse, imageUrl: 'javascript:alert(1)' })).status, 400);
    assert.equal((await send('POST', '', [validCourse])).status, 400);
  });

  test('POST não sofre prototype pollution', async () => {
    const response = await send('POST', '', `{"__proto__":{"polluted":true},${JSON.stringify(validCourse).slice(1)}`);
    assert.equal(response.status, 201);
    assert.equal({}.polluted, undefined);
  });

  test('JSON malformado retorna 400 sem stack trace', async () => {
    const response = await send('POST', '', '{invalido');
    assert.equal(response.status, 400);
    const text = await response.text();
    assert.doesNotMatch(text, /at .*\.js/);
  });

  test('PUT atualiza mantendo o id da URL', async () => {
    const response = await send('PUT', '/2', { ...validCourse, id: 99 });
    assert.equal(response.status, 200);
    const updated = await response.json();
    assert.equal(updated.id, 2);
    assert.equal(updated.name, validCourse.name);
  });

  test('PUT em id inexistente retorna 404 (sem criar índice -1)', async () => {
    assert.equal((await send('PUT', '/999', validCourse)).status, 404);
    const courses = await (await fetch(baseUrl)).json();
    assert.equal(courses.length, 5);
  });

  test('DELETE remove e depois retorna 404', async () => {
    assert.equal((await send('DELETE', '/3')).status, 204);
    assert.equal((await send('DELETE', '/3')).status, 404);
  });

  test('CORS só libera a origem configurada', async () => {
    const allowed = await fetch(baseUrl, { headers: { Origin: 'http://localhost:4200' } });
    assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:4200');

    const blocked = await fetch(baseUrl, { headers: { Origin: 'http://evil.example' } });
    assert.equal(blocked.headers.get('access-control-allow-origin'), null);
  });

  test('cabeçalhos de segurança presentes e x-powered-by ausente', async () => {
    const response = await fetch(baseUrl);
    assert.equal(response.headers.get('x-powered-by'), null);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  });

  test('payload acima do limite é rejeitado', async () => {
    const response = await send('POST', '', { ...validCourse, description: 'a'.repeat(20000) });
    assert.equal(response.status, 413);
  });
});
