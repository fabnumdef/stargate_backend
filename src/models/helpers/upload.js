import mongoose from 'mongoose';
import imageExtensions from 'image-extensions';

export const uploadFile = async (file, dbFilename, bucketName) => {
  try {
    const {
      filename, createReadStream, mimetype,
    } = await file;
    if (
      ![...imageExtensions, 'pdf'].includes(
        (filename.substring(filename.lastIndexOf('.') + 1, filename.length) || filename).toLowerCase(),
      )
    ) {
      throw new Error('Invalid file extension');
    }
    if (!(['application/pdf'].includes(mimetype) || /^image\//.test(mimetype))) {
      throw new Error('Invalid mimetype for this upload');
    }
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
  } catch (e) {
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
