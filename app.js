const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const app = express();

app.use(express.static('public'));

// * using multer
const storage = multer.memoryStorage();

// * multer filesize limits
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// * answer the root with the main html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// * check the magic number from the filetype.
function checkFileType(buffer) {
  const jpegMagicNumber = Buffer.from([0xff, 0xd8, 0xff]);
  const pngMagicNumber = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
  const gifMagicNumber = Buffer.from([0x47, 0x49, 0x46, 0x38]);

  if (buffer.slice(0, 3).equals(jpegMagicNumber)) {
    return 'image/jpeg';
  } else if (buffer.slice(0, 4).equals(pngMagicNumber)) {
    return 'image/png';
  } else if (buffer.slice(0, 4).equals(gifMagicNumber)) {
    return 'image/gif';
  } else {
    return null;
  }
}

// * handle upload
app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;

  // * Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif']; // * array of valid types
  const validExtensionsRegex = /\.(jpeg|jpg|png|gif)$/i; // * regex for valid extensions
  const multipleExtensionsRegex = /\.[^.]+(\.[^.]+)+$/; // * regex for multiple extensions
  const nullCharRegex = /\0/; //* regex for null char regex
  const fileType = checkFileType(file.buffer);
  const fileExtension = path.extname(file.originalname).toLowerCase();

  // * validate if the filetype is the same via magic numbers
  //* validate if the type is on our valid mime types
  //* validate if the final extension is on the regex
  //* validate that the file doesn't have null char.
  // * validate if the file doesn't have multiple extensions
  if (
    !fileType ||
    !validTypes.includes(fileType) ||
    !validExtensionsRegex.test(fileExtension) ||
    nullCharRegex.test(file.originalname) ||
    multipleExtensionsRegex.test(file.originalname)
  ) {
    return res
      .status(400)
      .sendFile(path.join(__dirname, 'public', 'upload-failed.html'));
  }

  // * rename file with the date (we could randomize the name)
  const newFileName = `${Date.now()}${fileExtension}`;
  const uploadPath = path.join(__dirname, 'public', 'uploads', newFileName);

  // Save the file
  fs.writeFile(uploadPath, file.buffer, (err) => {
    if (err) {
      return res.status(500).send('Error saving file');
    }
    res.sendFile(path.join(__dirname, 'public', 'upload-success.html'));
  });
});

//* listener
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
