import { nanoid } from 'nanoid';
import request from 'supertest';
import { generateDummyUser } from '../models/user';
import Request, { createDummyRequest } from '../models/request';
import Campus, { createDummyCampus } from '../models/campus';
import Visitor, { createDummyVisitor } from '../models/visitor';
import app from '../../src/app';
import DownloadToken from '../../src/models/download-token';
import { deleteUploadedFile, uploadFile } from '../../src/models/helpers/upload';
import { BUCKETNAME_VISITOR_FILE } from '../../src/models/visitor';
import { fileUpload } from '../helpers/file-upload';

it('Test to export a file', async () => {
  const campus = await createDummyCampus();
  const owner = await generateDummyUser();
  const dummyRequest = await createDummyRequest({ campus, owner });
  const v = await createDummyVisitor({ request: dummyRequest });
  const dbFilename = nanoid();
  const file = await uploadFile(fileUpload[0].files.file, dbFilename, BUCKETNAME_VISITOR_FILE);
  const downloadToken = await DownloadToken.createIdentityFileToken(BUCKETNAME_VISITOR_FILE, file);
  try {
    const result = await request(app.callback()).get(`/download/${downloadToken._id}`);
    expect(result.statusCode).toEqual(200);
  } finally {
    await deleteUploadedFile(file._id, BUCKETNAME_VISITOR_FILE);
    await Campus.findOneAndDelete({ _id: campus._id });
    await Request.findOneAndDelete({ _id: dummyRequest._id });
    await Visitor.findOneAndDelete({ _id: v._id });
    await DownloadToken.findOneAndDelete({ _id: downloadToken._id });
  }
});
