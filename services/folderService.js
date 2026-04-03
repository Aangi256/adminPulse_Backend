const fs = require("fs");
const path = require("path");

exports.createFolder = (jobId) => {
  const dir = path.join(__dirname, `../storage/${jobId}`);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  console.log("Folder Created:", dir);
};