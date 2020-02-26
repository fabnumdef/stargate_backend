import nanoid from 'nanoid';
import queryFactory, { gql } from '../helpers/apollo-query';
import {generateDummyUser, createDummyUser} from "../models/user";

const CREATE_CAMPUS_MUTATION = gql`
    mutation CreateCampusMutation($campus: CampusInput!) {
        createCampus(campus: $campus) {
            id
            label
        }
    }
`;

function mutateCreateCampus(campus, user = null) {
    const {mutate} = queryFactory(user);
    return mutate({
        mutation: CREATE_CAMPUS_MUTATION,
        variables: { campus },
        http: {
            headers: { 'Authorization': `Bearer Foo` },
        },
    })
}

it('Test to create a campus', async () => {
    const user = generateDummyUser();
    const { errors } = await mutateCreateCampus({
        id: 'FOO',
        label: 'Foo',
    });

    expect(errors).toHaveLength(1);
});
