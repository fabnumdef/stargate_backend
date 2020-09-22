import request from 'supertest';
import { generateDummyUser } from '../models/user';
import Request, { createDummyRequest } from '../models/request';
import { createDummyCampus } from '../models/campus';
import Visitor, { createDummyVisitor } from '../models/visitor';
import app from '../../src/app';
import ExportToken from '../../src/models/export-token';

it('Test to export list visitors in a campus', async () => {
  const campus = await createDummyCampus();
  const owner = await generateDummyUser();
  const dummyRequest = await createDummyRequest({ campus, owner });
  const visitors = [
    await createDummyVisitor({ request: dummyRequest }),
    await createDummyVisitor({ request: dummyRequest }),
  ];
  const exportToken = await campus.createCSVTokenForVisitors();
  try {
    {
      const result = await request(app.callback()).get(`/download/${exportToken._id}`);
      expect(result.text.split('\n').length).toEqual(3);
    }
    {
      const { statusCode, body: { message } } = await request(app.callback()).get('/download/foo');
      expect(message).toEqual('Token not found');
      expect(statusCode).toEqual(404);
    }
    {
      const forgedToken = await campus.createCSVTokenForVisitors();
      await ExportToken.updateOne({ _id: forgedToken._id }, { $set: { type: 'JSON' } });
      const { statusCode, body: { message } } = await request(app.callback())
        .get(`/download/${forgedToken._id}`);
      expect(message).toEqual('Export format not supported');
      expect(statusCode).toEqual(500);
    }
  } finally {
    await Promise.all(visitors.map((v) => Visitor.findOneAndDelete({ _id: v._id })));
    await Request.findOneAndDelete({ _id: dummyRequest._id });
    await campus.deleteOne();
  }
});

it('Test to export a template for visitors', async () => {
  const campus = await createDummyCampus();
  const exportToken = await campus.createVisitorsTemplate();
  try {
    const result = await request(app.callback()).get(`/download/${exportToken._id}`);
    expect(result.text.split('\n').length).toEqual(1);
  } finally {
    await campus.deleteOne();
  }
});
