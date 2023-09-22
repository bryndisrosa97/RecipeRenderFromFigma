import util from 'util';
import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

import { debug } from '../utils/debug.js';

dotenv.config();

const readDirAsync = util.promisify(fs.readdir);
const statAsync = util.promisify(fs.stat);
const resourcesAsync = util.promisify(cloudinary.api.resources);
const uploadAsync = util.promisify(cloudinary.uploader.upload);

const {
  CLOUDINARY_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

if (!CLOUDINARY_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.warn('Vantar cloudinary config, mun ekki virka að hlaða upp myndum');
}

cloudinary.config({
  cloud_name: CLOUDINARY_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

let cachedListImages = null;

async function listImages() {
  if (cachedListImages) {
    return Promise.resolve(cachedListImages);
  }
  const res = await resourcesAsync({ max_results: 150 });

  cachedListImages = res.resources;

  return res.resources;
}

function imageComparer(current) {
  return (uploaded) => uploaded.bytes === current.size;
}

async function getImageIfUploaded(imagePath) {
  const uploaded = await listImages();

  const stat = await statAsync(imagePath);

  const current = { size: stat.size };

  const found = uploaded.find(imageComparer(current));

  return found;
}

async function uploadImageIfNotUploaded(imagePath) {
  const alreadyUploaded = await getImageIfUploaded(imagePath);

  if (alreadyUploaded) {
    debug(`Mynd ${imagePath} þegar uploadað`);
    return alreadyUploaded.secure_url;
  }

  const uploaded = await uploadAsync(imagePath);
  debug(`Mynd ${imagePath} uploadað`);

  return uploaded.secure_url;
}

export async function uploadImagesFromDisk(imageDir) {
  const imagesFromDisk = await readDirAsync(imageDir);

  const filteredImages = imagesFromDisk
    .filter((i) => path.extname(i).toLowerCase() === '.jpg');

  debug(`Bæti við ${filteredImages.length} myndum`);

  const images = [];

  for (let i = 0; i < filteredImages.length; i += 1) {
    const image = filteredImages[i];
    const imagePath = path.join(imageDir, image);
    const uploaded = await uploadImageIfNotUploaded(imagePath); // eslint-disable-line
    images.push(uploaded);
  }

  debug('Búið að senda myndir á Cloudinary');

  return images;
}
