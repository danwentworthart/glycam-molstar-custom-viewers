// Checks the version in package.json and compiles the TypeScript file to 
// JavaScript with that version number.
// This is supposed to auto compile when the glycam_molstar.ts file is changed, but it fails.
console.error("This is not working correctly. You may have better luck using the build command.");
const { exec } = require('child_process');
const { version } = require('./package.json');
const src = './src/glycam_molstar.ts';
const package_destination_prefix = './build/js/glycam_molstar_';
const watchCommand = `esbuild ${src} --bundle --outfile=${package_destination_prefix}${version}.js --global-name=molstarLib --watch`;

exec(watchCommand, (err, stdout, stderr) => {
  if (err) {
    console.error(`Error: ${err}`);
    return;
  }
  console.log(stdout);
  console.error(stderr);
});