import fs from 'fs';
import { nanoid } from 'nanoid';

const file = [Promise.resolve({
  createReadStream: () => fs.createReadStream(`${__dirname}/test.txt`),
  filename: 'test.txt',
  mimetype: 'text/plain',
  encoding: '7bit',
})];

const csvFile = Promise.resolve({
  createReadStream: () => fs.createReadStream(`${__dirname}/csvFile.csv`),
  filename: 'csvFile.csv',
  mimetype: 'text/csv',
  encoding: '7bit',
});

const fileError = Promise.resolve({
  createReadStream: () => fs.createReadStream('./fakePath'),
  filename: 'fileError',
  mimetype: 'application/pdf',
  encoding: '7bit',
});

export const fileUpload = [{
  value: nanoid(),
  files: file,
}];

export const fileUploadError = [{
  value: nanoid(),
  files: fileError,
}];

export const csvFileUpload = {
  file: csvFile,
};
