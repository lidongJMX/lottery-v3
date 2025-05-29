require('./config/dotenv');
const app = require('./app');
const http = require('http');

const port = process.env.PORT || 8000;

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});