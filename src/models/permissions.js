import { shield } from 'graphql-shield';
import { isAuthenticated, isSuperAdmin, allow } from './rules';

export default shield({
  Query: {
    listCampuses: isAuthenticated,
    getCampus: isAuthenticated,
    me: isAuthenticated,
    '*': isSuperAdmin,
  },
  Mutation: {
    login: allow,
    resetPassword: allow,
    jwtRefresh: isAuthenticated,
    editMe: isAuthenticated,
    '*': isSuperAdmin,
  },
  CampusMutation: {
    '*': isSuperAdmin,
  },
}, {
  allowExternalErrors: true,
});
