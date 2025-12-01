const fs = require("fs");
const path = require("path");

const fsFetcher = filePath => {
  // there are also pothential issues with access rights
  // which I ignore for now
  if (fs.existsSync(filePath)) {
    return Promise.resolve(fs.readFileSync(filePath, "utf8"));
  } else {
    return Promise.resolve(false);
  }
};

exports.default = fsFetcher;
