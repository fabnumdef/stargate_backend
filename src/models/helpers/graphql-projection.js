function transformProjection(graphQLInfo) {
  try {
    const projection = graphQLInfo
      .fieldNodes
      .map((node) => node.selectionSet.selections.map((selection) => selection.name.value))
      .reduce([].concat.call)
      .reduce((acc, row) => ({ ...acc, [row]: 1 }), {});
    return {
      ...projection,
      _id: true,
    };
  } catch (e) {
    return {};
  }
}
export default function createdAtPlugin(schema) {
  /* eslint-disable no-param-reassign */
  schema.statics.findOneWithProjection = function findOneWithProjection(search, graphQLInfo) {
    return this.findOne(search, transformProjection(graphQLInfo));
  };
  schema.statics.findWithProjection = function findWithProjection(search, graphQLInfo) {
    const projection = transformProjection(graphQLInfo);
    return this.find(search, projection);
  };
  schema.statics.findByIdWithProjection = function findByIdWithProjection(id, graphQLInfo) {
    return this.findById(id, transformProjection(graphQLInfo));
  };
}
