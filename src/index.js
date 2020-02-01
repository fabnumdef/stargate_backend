// @flow
const debug = require('debug')('api');
debug('Server starting...');
debug('logging with debug enabled!');

require('dotenv').config();
import Koa from 'koa';
import compression from 'koa-compress';
import { createServer } from 'http';
import apolloServer from './apollo-server';

const port = process.env.PORT || 3000;

const app = new Koa();
app.use(compression());

apolloServer.applyMiddleware({ app, path: '/api' });

app.listen(port);

debug(`GraphQL API running at http://localhost:${port}/api`);
