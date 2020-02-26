export const OffsetPaginatorMeta = {
    async total({filters, Model}) {
        return Model.countDocuments(filters);
    },
    first: ({cursor: {first}}) => first,
    offset: ({cursor: {offset}}) => offset,
}