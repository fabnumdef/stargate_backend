import { shield} from 'graphql-shield';
import { isAuthenticated, isSuperAdmin, allow } from "./rules";

export default shield({
    Query: {
        listCampuses: isAuthenticated,
        '*': isSuperAdmin,
    },
    Mutation: {
        login: allow,
        '*': isSuperAdmin,
    }
}, {
    allowExternalErrors: true,
})