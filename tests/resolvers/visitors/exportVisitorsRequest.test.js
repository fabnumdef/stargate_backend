import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummyAdmin, generateDummyUser } from '../../models/user';
import Request, { createDummyRequest } from '../../models/request';
import { createDummyCampus } from '../../models/campus';
import Visitor, { createDummyVisitor } from '../../models/visitor';
import Unit, { createDummyUnit } from '../../models/unit';

function mutationCSVExportVisitors(campusId, visitorsId, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    mutation: gql`
      mutation GenerateCSVLinkMutation($campusId: String!, $visitorsId: [String]) {
        mutateCampus(id: $campusId) {
          generateCSVExportLink(visitorsId: $visitorsId) {
              token
              link
            }
        }
      }
    `,
    variables: {
      campusId,
      visitorsId,
    },
  });
}

it('Test to export list visitors in a campus', async () => {
  const campus = await createDummyCampus();
  const unit = await createDummyUnit();
  const owner = await generateDummyUser({ unit });
  const dummyRequest = await createDummyRequest({ campus, owner });
  const visitors = [
    await createDummyVisitor({ request: dummyRequest }),
    await createDummyVisitor({ request: dummyRequest }),
  ];

  try {
    {
      const { errors } = await mutationCSVExportVisitors(campus._id);
      // You're not authorized to create places while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { data: { mutateCampus: { generateCSVExportLink } } } = await mutationCSVExportVisitors(
        campus._id,
        [visitors[0]._id.toString()],
        generateDummyAdmin(),
      );
      expect(generateCSVExportLink.token)
        .toMatch(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);
    }
  } finally {
    await Promise.all(visitors.map((v) => Visitor.findOneAndDelete({ _id: v._id })));
    await Request.findOneAndDelete({ _id: dummyRequest._id });
    await campus.deleteOne();
    await Unit.findOneAndDelete({ _id: unit._id });
  }
});
