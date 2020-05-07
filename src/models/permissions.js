import { shield, or } from 'graphql-shield';
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
    createUser: or(isAdmin, isSuperAdmin),
    editMe: isAuthenticated,
    '*': isSuperAdmin,
  },
  CampusMutation: {
    '*': isSuperAdmin,
  },
}, {
  allowExternalErrors: true,
});
