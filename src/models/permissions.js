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
    listUsers: or(isAdmin, isSuperAdmin),
    '*': isSuperAdmin,
  },
  Mutation: {
    login: allow,
    resetPassword: allow,
    jwtRefresh: isAuthenticated,
    createUser: or(isAdmin, isSuperAdmin),
    editUser: or(isAdmin, isSuperAdmin),
    deleteUser: or(isAdmin, isSuperAdmin),
    mutateCampus: or(isAdmin, isSuperAdmin),
    editMe: isAuthenticated,
    '*': isSuperAdmin,
  },
  CampusMutation: {
    createRequest: isAdmin,
    editRequest: isAdmin,
    deleteRequest: isAdmin,
    mutateRequest: isAdmin,
    '*': isSuperAdmin,
  },
  RequestMutation: {
    createVisitor: isAdmin,
    editVisitor: isAdmin,
    deleteVisitor: isAdmin,
  },
}, {
  allowExternalErrors: true,
});
