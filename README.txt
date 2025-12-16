This module uses typescript. 

Initial installation
To set up an environment for this repo, you will need to install Node.js

    nvm install v21.0.0
    nvm use v21.0.0
    nvm install


Dependencies
- molstar: 4.8.0 
- react: 18.3.1
- react-Dom: 18.3.1

These should be updatable with commands such as:

    npm update molstar

But there is a version defined in package.json that will hold it in a version range.

You can get the absolute latest, and ignore the version range with:

    npm install molstar@latest


or specify a version:

    npm install molstar@4.9.0


May be able to check for new versions with:

    npm view molstar versions


And finally, you can ask which node modules are outdated in your project with:

    npm outdated


Day to day editing
Before building, you currently need to tell nvm to use the correct version (note that "nvm" is not "npm" or a type-o):

    nvm use v21.0.0

Make edits to the *.tsx or *.ts file you intend to use.

Compile the simple viewer with the following command:

    npm run build

Compile the viewer with React controls with the following command:

    npm run build_ui

Note: 
- These may be edited in package.json. 
- If the commands fail, check to see if that file was edited.
- The "scripts" field in package.json lists what you can build.

Watch has not been working correctly, so the current workflow is:

1. Make edits in the src dir as shown above 
2. (Optional: only if you need to be cache-busting) Update the version number in package.json when you are ready to test in the website.
3. Compile as shown above
4. Copy the compiled build/js/*viewer*.js to one of the paths below, or wherever the destination devEnv's static dir is:
5. (Optional: only if you need to be cache-busting) Update the filename in whatever html files load this js file. 
    Match the version numbers.

V_2/Django/glycam-django/glycamweb/static/molstar/js/
V_2/Django/glycam-django/glycamweb/static/molstar/css/

Note:
glycam_molstar.ts does not involve React, and has none of the extra controls. This is the simplest viewer.
glycam_mostar_ui.tsx does involve React, and does have the extra controls. This is currently used by the full-page viewer.
