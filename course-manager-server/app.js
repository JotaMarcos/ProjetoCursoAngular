const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');

const SEED_COURSES = require('./courses.json');
const { findCourseImage, DEFAULT_IMAGE } = require('./image-search');

// IMAGE_SEARCH=off desliga a busca de imagem na web (ex.: máquina sem internet).
const IMAGE_SEARCH_ENABLED = process.env.IMAGE_SEARCH !== 'off';

// Origens autorizadas a chamar a API (separadas por vírgula). Padrão: dev server do Angular.
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:4200')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

// Campos que o cliente pode enviar; qualquer outro é descartado (evita mass assignment / prototype pollution).
const COURSE_FIELDS = {
  name: { type: 'string', required: true, maxLength: 120 },
  description: { type: 'string', required: true, maxLength: 2000 },
  price: { type: 'number', required: true, min: 0, max: 100000 },
  rating: { type: 'number', required: true, min: 0, max: 5 },
  duration: { type: 'number', required: false, min: 0, max: 100000 },
  code: { type: 'string', required: false, maxLength: 20, pattern: /^[A-Za-z0-9-]*$/ },
  releaseDate: { type: 'string', required: false, maxLength: 40 },
  imageUrl: { type: 'string', required: false, maxLength: 300, pattern: /^(\/assets\/[\w\-./]+|https:\/\/[^\s"'<>]+)$/ }
};

function validateCourse(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: ['O corpo da requisição deve ser um objeto JSON.'] };
  }

  const course = {};
  const errors = [];

  for (const [field, rule] of Object.entries(COURSE_FIELDS)) {
    const value = body[field];

    if (value === undefined || value === null || value === '') {
      if (rule.required) {
        errors.push(`Campo "${field}" é obrigatório.`);
      }
      continue;
    }

    if (rule.type === 'number') {
      if (typeof value !== 'number' || !Number.isFinite(value) || value < rule.min || value > rule.max) {
        errors.push(`Campo "${field}" deve ser um número entre ${rule.min} e ${rule.max}.`);
        continue;
      }
    } else {
      if (typeof value !== 'string' || value.length > rule.maxLength || (rule.pattern && !rule.pattern.test(value))) {
        errors.push(`Campo "${field}" inválido.`);
        continue;
      }
    }

    course[field] = typeof value === 'string' ? value.trim() : value;
  }

  return errors.length ? { errors } : { course };
}

function parseId(request, response, next) {
  const id = Number(request.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return response.status(400).json({ error: 'Id inválido.' });
  }
  request.courseId = id;
  next();
}

function createApp({ findImage = IMAGE_SEARCH_ENABLED ? findCourseImage : async () => DEFAULT_IMAGE } = {}) {
  // Cada instância tem sua própria cópia dos dados (isola os testes).
  let courses = structuredClone(SEED_COURSES);

  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
    optionsSuccessStatus: 200
  }));
  app.use(rateLimit({
    windowMs: 60 * 1000,
    limit: Number(process.env.RATE_LIMIT_PER_MINUTE) || 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false
  }));
  app.use(express.json({ limit: '10kb' }));

  const router = express.Router();

  router.get('/courses', (request, response) => {
    response.json(courses);
  });

  router.post('/courses', async (request, response, next) => {
    const { course, errors } = validateCourse(request.body);
    if (errors) {
      return response.status(400).json({ errors });
    }

    if (!course.imageUrl) {
      try {
        course.imageUrl = await findImage(course.name);
      } catch (err) {
        return next(err);
      }
    }

    course.id = courses.length ? Math.max(...courses.map(c => c.id)) + 1 : 1;
    courses.push(course);

    response.status(201).json(course);
  });

  router.get('/courses/:id', parseId, (request, response) => {
    const course = courses.find(c => c.id === request.courseId);
    if (!course) {
      return response.status(404).json({ error: 'Curso não encontrado.' });
    }
    response.json(course);
  });

  router.put('/courses/:id', parseId, (request, response) => {
    const index = courses.findIndex(c => c.id === request.courseId);
    if (index === -1) {
      return response.status(404).json({ error: 'Curso não encontrado.' });
    }

    const { course, errors } = validateCourse(request.body);
    if (errors) {
      return response.status(400).json({ errors });
    }

    // O id vem sempre da URL, nunca do corpo.
    courses[index] = { ...courses[index], ...course, id: request.courseId };
    response.json(courses[index]);
  });

  router.delete('/courses/:id', parseId, (request, response) => {
    const exists = courses.some(c => c.id === request.courseId);
    if (!exists) {
      return response.status(404).json({ error: 'Curso não encontrado.' });
    }
    courses = courses.filter(c => c.id !== request.courseId);
    response.status(204).end();
  });

  app.use('/api', router);

  app.use((request, response) => {
    response.status(404).json({ error: 'Rota não encontrada.' });
  });

  // Não expõe stack trace ao cliente.
  // eslint-disable-next-line no-unused-vars
  app.use((err, request, response, next) => {
    const status = err.status || err.statusCode || 500;
    if (status >= 500) {
      console.error(err);
    }
    response.status(status).json({ error: status >= 500 ? 'Erro interno do servidor.' : 'Requisição inválida.' });
  });

  return app;
}

module.exports = { createApp, validateCourse };
