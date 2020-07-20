import { shield, or } from 'graphql-shield';
import {
  isAuthenticated,
  isSuperAdmin,
  isAdmin,
  allow,
  canHandleRequest,
  canHandleVisitor,
  isUnitCorrespondent,
} from './rules';

export default shield({
  Query: {
    listCampuses: isAuthenticated,
    getCampus: isAuthenticated,
    getUser: or(isAdmin, isSuperAdmin, isUnitCorrespondent),
    me: isAuthenticated,
    listUsers: or(isUnitCorrespondent, isAdmin, isSuperAdmin),
    '*': isSuperAdmin,
  },
  Mutation: {
    login: allow,
    resetPassword: allow,
    jwtRefresh: isAuthenticated,
    createUser: or(isAdmin, isSuperAdmin, isUnitCorrespondent),
    editUser: or(isAdmin, isSuperAdmin, isUnitCorrespondent),
    deleteUser: or(isAdmin, isSuperAdmin, isUnitCorrespondent),
    mutateCampus: or(isAdmin, isSuperAdmin, canHandleRequest, canHandleVisitor),
    editMe: isAuthenticated,
    '*': isSuperAdmin,
  },
  CampusMutation: {
    createRequest: or(canHandleRequest, isAdmin),
    editRequest: or(canHandleRequest, isAdmin),
    deleteRequest: or(canHandleRequest, isAdmin),
    mutateRequest: or(canHandleRequest, canHandleVisitor, isAdmin),
    shiftRequest: or(canHandleRequest, isAdmin),
    '*': isSuperAdmin,
  },
  RequestMutation: {
    createVisitor: or(canHandleRequest, isAdmin),
    editVisitor: or(canHandleRequest, isAdmin),
    deleteVisitor: or(canHandleRequest, isAdmin),
  },
}, {
  allowExternalErrors: true,
});
