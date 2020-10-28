import mongoose from 'mongoose';

export const uploadFile = async (file, dbFilename, bucketName) => {
  try {
    const {
      createReadStream, mimetype,
    } = await file;
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName });
    const uploadStream = bucket.openUploadStream(dbFilename, { contentType: mimetype });
    const storedFile = await (new Promise((resolve, reject) => {
      createReadStream()
        .pipe(uploadStream)
        .once('finish', (data) => {
          resolve(data);
        })
        .once('error', (error) => {
          reject(error);
        });
    }));
    return {
      _id: storedFile._id,
    };
  } catch (e) {
    return 'File upload error';
  }
};

export const deleteUploadedFile = async (id, bucketName) => {
  const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName });
  try {
    const uploadStream = await bucket.delete(id);
    return uploadStream;
  } catch {
    return 'File not found';
  }
};

export const downloadFile = async (image) => {
  const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: image.bucketName });
  const [file] = await bucket.find({ _id: image._id }).toArray();
  const data = { filename: file.filename, contentType: file.contentType };
  const downloadStream = bucket.openDownloadStream(image._id);
  return {
    data,
    stream: downloadStream,
  };
};
