export default {
  url: 'http://localhost:3044',
  http: { port : 3044},
  rethinkdb: {
    host: process.env['NODE_ENV'] === 'travis' ? 'localhost' : 'rethinkdb',
    db: 'test'
  }
}
