/**
 * since fs/promises exist after nodejs@14, so we make own fs/promises
 */
const fs = require('fs');
const { promisify } = require('util');

export const stat = promisify(fs.stat);
export const mkdir = promisify(fs.mkdir);
export const writeFile = promisify(fs.writeFile);
// fs.rm was added v14.14.0, so use fs.unlink
export const rm = promisify(fs.unlink);
