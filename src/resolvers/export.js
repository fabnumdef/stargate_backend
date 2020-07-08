// eslint-disable-next-line import/prefer-default-export
export const ExportLink = {
  token(exportToken) {
    return exportToken._id;
  },
  link(exportToken, _params, context) {
    return exportToken.getDownloadLink(context);
  },
};
