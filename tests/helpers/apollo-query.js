import './configure';

import { createTestClient } from 'apollo-server-testing';
export { gql } from 'apollo-server-koa'
import server from '../../src/apollo-server';

export const { query } = createTestClient(server);