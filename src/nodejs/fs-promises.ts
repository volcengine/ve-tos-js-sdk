/**
 * since fs/promises exist after nodejs@14, so we make own fs/promises
 */
import fs from 'fs';
import { promisify } from 'util';

export const open = promisify(fs.open);
export const close = promisify(fs.close);
export const rename = promisify(fs.rename);
export const stat = promisify(fs.stat);
export const mkdir = promisify(fs.mkdir);
export const writeFile = promisify(fs.writeFile);
export const write = promisify(fs.write);
export const appendFile = promisify(fs.appendFile);
// fs.rm was added v14.14.0, so use fs.unlink
export const rm = promisify(fs.unlink);
export const readFile = promisify(fs.readFile);
