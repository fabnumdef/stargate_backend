import nanoid from 'nanoid';
import { query, gql } from '../helpers/apollo-query';
import {generateDummyUser, createDummyUser} from "../models/user";

const JWT_LOGIN_QUERY = gql`
    mutation ScratchQuery($email: EmailAddress!, $password: String!) {
        login(email: $email, password: $password) {
            jwt
        }
    }
`;

function queryJwt(email, password) {
    return query({ query: JWT_LOGIN_QUERY, variables: { email, password } })
}

it('Test to login unexisting user', async () => {
    const user = generateDummyUser();
    const {errors} = await queryJwt(user.email.original, user.password);

    expect(errors).toHaveLength(1);
});

it('Test to login existing user', async () => {
    const password = nanoid();
    const user = await createDummyUser({password});
    try {
        {
            const {data: {login: { jwt }}} = await queryJwt(user.email.original, password);
            expect(jwt).toMatch(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/);
        }
        {
            const {errors} = await queryJwt(user.email.original, "WrongPassword");
            expect(errors).toHaveLength(1);

        }
    } finally {
        await user.deleteOne();
    }
});