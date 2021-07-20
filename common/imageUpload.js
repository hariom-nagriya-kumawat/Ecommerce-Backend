const fs = require("fs");
const path = require("path");
const fileType = require("file-type");
const __basedir = path.join(__dirname, "../public");

const imageUpload = async (imageData, folderName, imgName) => {
  let base64Image = imageData.split(";base64,")[1];
  var buf = Buffer.from(base64Image, "base64");
  let type = await fileType.fromBuffer(Buffer.from(base64Image, "base64"));
  let fileName = [imgName, type.ext || "png"].join("");
  let originalImagePath = path.join(__basedir, folderName, fileName);
  fs.writeFileSync(originalImagePath, buf);
  return [folderName, "/", fileName].join("");
};

const imageDelte = () => {};

const pdfUpload = async (pdfData, folderName, pdfName) => {
  let base64Pdf = pdfData.split(";base64,")[1];
  var buf = Buffer.from(base64Pdf, "base64");
  let type = await fileType.fromBuffer(Buffer.from(base64Pdf, "base64"));
  let fileName = [pdfName, type.ext || "pdf"].join("");
  let originalPdfPath = path.join(__basedir, folderName, fileName);
  fs.writeFileSync(originalPdfPath, buf);
  return [folderName, "/", fileName].join("");
}

module.exports = {
  imageUpload,
  imageDelte,
  pdfUpload
};
