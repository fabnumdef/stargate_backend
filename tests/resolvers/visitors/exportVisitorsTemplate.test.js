import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummySuperAdmin } from '../../models/user';
import { createDummyCampus } from '../../models/campus';

function queryCSVExportTemplateVisitors(campusId, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    query: gql`
        query getViitorsTemplate($campusId: String!) {
            getCampus(id: $campusId) {
                getVisitorsTemplate {
                    token
                    link
                }
            }
        }
    `,
    variables: {
      campusId,
    },
  });
}

it('Test to export CSV template visitors', async () => {
  const campus = await createDummyCampus();

  try {
    {
      const { errors } = await queryCSVExportTemplateVisitors(campus._id);
      // You're not authorized to create places while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { data: { getCampus: { getVisitorsTemplate } } } = await queryCSVExportTemplateVisitors(
        campus._id,
        generateDummySuperAdmin(),
      );
      expect(getVisitorsTemplate.token)
        .toMatch(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);
    }
  } finally {
    await campus.deleteOne();
  }
});
