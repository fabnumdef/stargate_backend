import request from 'supertest';
import { generateDummyUser } from '../models/user';
import Request, { createDummyRequest } from '../models/request';
import { createDummyCampus } from '../models/campus';
import Visitor, { createDummyVisitor } from '../models/visitor';
import app from '../../src/app';
import ExportToken from '../../src/models/export-token';
import { createDummyUnit } from '../models/unit';

it('Test to export list visitors in a campus', async () => {
  const campus = await createDummyCampus();
  const unit = await createDummyUnit();
  const owner = await generateDummyUser({ unit });
  const dummyRequest = await createDummyRequest({ campus, owner });
  const visitors = [
    await createDummyVisitor({ request: dummyRequest }),
    await createDummyVisitor({ request: dummyRequest }),
  ];
  const exportToken = await campus.createCSVTokenForVisitors();
  try {
    {
      const result = await request(app.callback()).get(`/export/${exportToken._id}`);
      expect(result.text.split('\n').length).toEqual(3);
      const visitorDb = await Visitor.findOne({ _id: visitors[0]._id });
      expect(visitorDb.exportDate).toBeDefined();
    }
    {
      const { statusCode, body: { message } } = await request(app.callback()).get('/export/foo');
      expect(message).toEqual('Token not found');
      expect(statusCode).toEqual(404);
    }
    {
      const forgedToken = await campus.createCSVTokenForVisitors();
      await ExportToken.updateOne({ _id: forgedToken._id }, { $set: { format: 'JSON' } });
      const { statusCode, body: { message } } = await request(app.callback())
        .get(`/export/${forgedToken._id}`);
      expect(message).toEqual('Export format not supported');
      expect(statusCode).toEqual(500);
    }
  } finally {
    await Promise.all(visitors.map((v) => Visitor.findOneAndDelete({ _id: v._id })));
    await Request.findOneAndDelete({ _id: dummyRequest._id });
    await campus.deleteOne();
    await unit.deleteOne();
  }
});

it('Test to export template for group of visitors', async () => {
  const campus = await createDummyCampus();
  const exportToken = await campus.createVisitorsTemplate();
  try {
    {
      const result = await request(app.callback()).get(`/export/${exportToken._id}`);
      expect(result.type).toEqual('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(result.statusCode).toEqual(200);
    }
    {
      const { statusCode, body: { message } } = await request(app.callback()).get('/export/foo');
      expect(message).toEqual('Token not found');
      expect(statusCode).toEqual(404);
    }
    {
      const forgedToken = await campus.createCSVTokenForVisitors();
      await ExportToken.updateOne({ _id: forgedToken._id }, { $set: { format: 'JSON' } });
      const { statusCode, body: { message } } = await request(app.callback())
        .get(`/export/${forgedToken._id}`);
      expect(message).toEqual('Export format not supported');
      expect(statusCode).toEqual(500);
    }
  } finally {
    await campus.deleteOne();
  }
});
