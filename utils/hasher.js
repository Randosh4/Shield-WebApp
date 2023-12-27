const crypto = require('crypto');

// Function to hash file content using SHA-256
const hashFileContent = (fileBuffer) => {
    const hash = crypto.createHash('sha256');
    hash.update(fileBuffer);
    return hash.digest('hex');
};
const compareFileHash = (fileBuffer, existingHash) => {
    const hash = crypto.createHash('sha256');
    hash.update(fileBuffer);
    const newHash = hash.digest('hex');
    return newHash === existingHash;
};

// Function to hash object using SHA-256
const hashObject = (object) => {
    const objectString = JSON.stringify(object);
    const hash = crypto.createHash('sha256');
    hash.update(objectString);
    return hash.digest('hex');
};

module.exports = {
    hashFileContent,
    hashObject,
};
