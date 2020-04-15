import { shield } from 'graphql-shield';
import { isAuthenticated, isSuperAdmin, allow } from './rules';

export default shield({
  Query: {
    listCampuses: isAuthenticated,
    getCampus: isAuthenticated,
    '*': isSuperAdmin,
  },
  Mutation: {
    login: allow,
    jwtRefresh: isAuthenticated,
    '*': isSuperAdmin,
  },
}, {
  allowExternalErrors: true,
});
