const fs = require('fs');

const MAX_BYTES = 1024 * 13;
const filename = './dist/game.zip';

function getFilesizeInBytes(filename)
{
  return fs.statSync(filename).size;
}

function fileIsUnderMaxSize(fileSize)
{
  return fileSize <= MAX_BYTES;
}

fileSize = getFilesizeInBytes(filename);
fileSizeDifference = Math.abs(MAX_BYTES - fileSize);

if (fileIsUnderMaxSize(fileSize))
{
  console.log(`\x1B[32mThe file is under the limit.`);
  console.log(`\x1B[32mUSED: ${(fileSize / MAX_BYTES * 100).toFixed(2).padStart(5)} % | ${(fileSize + "").padStart(5)} BYTES`);
  console.log(`\x1B[32mLEFT: ${((MAX_BYTES - fileSize) / MAX_BYTES * 100).toFixed(2).padStart(5)} % | ${(MAX_BYTES - fileSize + "").padStart(5)} BYTES`);
  process.exit(0);
}
else
{
  console.log(`\x1B[31mThe file is ${fileSize} bytes (${fileSizeDifference} bytes over the limit).`);
  console.log(`\x1B[31mUSED: ${(fileSize / MAX_BYTES * 100).toFixed(2).padStart(5)} % | ${(fileSize + "").padStart(5)} BYTES`);
  process.exit(0);
}