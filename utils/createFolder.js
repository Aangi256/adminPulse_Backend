const fs = require("fs");
const path = require("path");

module.exports = (jobId) => {
  const folderPath = path.join(__dirname, `../uploads/${jobId}`);

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  return folderPath;
};