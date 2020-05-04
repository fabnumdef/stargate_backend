import { shield } from 'graphql-shield';
import {
  isAuthenticated,
  isSuperAdmin,
  isAdmin,
  allow,
} from './rules';

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
    createUser: isAdmin,
    editMe: isAuthenticated,
    '*': isSuperAdmin,
  },
}, {
  allowExternalErrors: true,
});
