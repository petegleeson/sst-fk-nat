import http from "node:http";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 1234;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");
  res.end(`Hello world. The time is ${new Date().toISOString()}`);
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
