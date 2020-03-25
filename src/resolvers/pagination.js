// eslint-disable-next-line import/prefer-default-export
export const OffsetPaginatorMeta = {
  async total({ filters, countMethod }) {
    return countMethod(filters);
  },
  first: ({ cursor: { first } }) => first,
  offset: ({ cursor: { offset } }) => offset,
};
