export const HYDRATION_KEY = 'hydrationPolicy';
export const HYDRATION_FORCE = 'force';
export const HYDRATION_NEVER = 'never';

function transformProjection(graphQLInfo, { force, omit }) {
  try {
    const projection = graphQLInfo
      .fieldNodes
      .map((node) => node.selectionSet.selections.map((selection) => selection.name.value))
      .reduce([].concat.call)
      .reduce((acc, row) => ({ ...acc, [row]: 1 }), {});
    return {
      ...projection,
      ...force.reduce((acc, cur) => Object.assign(acc, { [cur]: true }), {}),
      ...omit.reduce((acc, cur) => Object.assign(acc, { [cur]: false }), {}),
    };
  } catch (e) {
    return {};
  }
}
export default function graphQLProjectionPlugin(schema) {
  // Keys are sanitized by graphQL here
  /* eslint-disable security/detect-object-injection */
  const pathKeys = Object.keys(schema.paths);
  const force = [
    '_id',
    ...[].concat((schema.options[HYDRATION_KEY] || {})[HYDRATION_FORCE] || []),
    ...pathKeys.filter((k) => (schema.paths[k].options || {})[HYDRATION_KEY] === HYDRATION_FORCE),
  ];
  const omit = [
    ...[].concat((schema.options[HYDRATION_KEY] || {})[HYDRATION_NEVER] || []),
    ...pathKeys.filter((k) => (schema.paths[k].options || {})[HYDRATION_KEY] === HYDRATION_NEVER),
  ];

  /* eslint-disable no-param-reassign */
  schema.statics.findOneWithProjection = function findOneWithProjection(search, graphQLInfo) {
    return this.findOne(search, transformProjection(graphQLInfo, { force, omit }));
  };
  schema.statics.findWithProjection = function findWithProjection(search, graphQLInfo) {
    const projection = transformProjection(graphQLInfo, { force, omit });
    return this.find(search, projection);
  };
  schema.statics.findByIdWithProjection = function findByIdWithProjection(id, graphQLInfo) {
    return this.findById(id, transformProjection(graphQLInfo, { force, omit }));
  };
}
