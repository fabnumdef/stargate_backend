import fs from 'fs';
import stream from 'stream';
import { nanoid } from 'nanoid';
import path from 'path';

const file = Promise.resolve({
  // non-literal to ensure file location
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  createReadStream: () => fs.createReadStream(path.join(__dirname, 'test.txt')),
  filename: 'test.txt',
  mimetype: 'text/plain',
  encoding: '7bit',
});

const fileError = Promise.resolve({
  createReadStream: () => stream.PassThrough,
  filename: 'fileError',
  mimetype: 'application/pdf',
  encoding: '7bit',
});

export const fileUpload = [{
  value: nanoid(),
  files: { file },
}];

export const fileUploadError = [{
  value: nanoid(),
  files: { file: fileError },
}];
