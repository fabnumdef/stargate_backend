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

const imageJpg = Promise.resolve({
  // non-literal to ensure file location
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  createReadStream: () => fs.createReadStream(path.join(__dirname, 'test.jpg')),
  filename: 'test.jpg',
  mimetype: 'image/jpeg',
  encoding: '7bit',
});

const csvFile = Promise.resolve({
  createReadStream: () => fs.createReadStream(`${__dirname}/csvFile.csv`),
  filename: 'csvFile.csv',
  mimetype: 'text/csv',
  encoding: '7bit',
});

const xlsxFile = Promise.resolve({
  createReadStream: () => fs.createReadStream(`${__dirname}/xlsxFile.xlsx`),
  filename: 'xlsxFile.xlsx',
  mimetype: 'text/xlsx',
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

export const imageUpload = [{
  value: `${nanoid()}.jpg`,
  files: { file: imageJpg },
}];

export const fileUploadError = [{
  value: nanoid(),
  files: { file: fileError },
}];

export const csvFileUpload = {
  file: csvFile,
};

export const xlsxFileUpload = {
  file: xlsxFile,
};
