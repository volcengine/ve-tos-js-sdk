/**
 * since fs/promises exist after nodejs@14, so we make own fs/promises
 */
const fs = require('fs');
const { promisify } = require('util');

module.exports.stat = promisify(fs.stat);
module.exports.mkdir = promisify(fs.mkdir);
module.exports.writeFile = promisify(fs.writeFile);
module.exports.rm = promisify(fs.rm);
