// Checks the version in package.json and compiles the TypeScript file to 
// JavaScript with that version number.

const { exec } = require('child_process');
const { version } = require('./package.json');
const src = './src/apps/gp/gp_viewer_ui.tsx';
const package_destination_prefix = './build/js/gp/gp_viewer_ui_';
const buildCommand = `esbuild ${src} --bundle --outfile=${package_destination_prefix}${version}.js --global-name=molstarLib`;

exec(buildCommand, (err, stdout, stderr) => {
  if (err) {
    console.error(`Error: ${err}`);
    return;
  }
  console.log(stdout);
  console.error(stderr);
});