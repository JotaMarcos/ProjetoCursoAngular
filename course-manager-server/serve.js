const { createApp } = require('./app');

const PORT = Number(process.env.PORT) || 3100;
// Por padrão escuta só na máquina local; use HOST=0.0.0.0 para expor na rede.
const HOST = process.env.HOST || '127.0.0.1';

createApp().listen(PORT, HOST, () => {
  console.log(`Server started at http://${HOST}:${PORT}`);
});
