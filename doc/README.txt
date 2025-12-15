This module uses typescript. 

Before building, you currently need to tell nvm to use the correct version (note that "nvm" is not "npm" or a type):
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
4. Copy the compiled build/js/glycam_molstar_${version}.js to the following path, or wherever the destination devEnv is:
5. (Optional: only if you need to be cache-busting) Update the filename in whatever html files load this js file. 
    Match the version numbers.

V_2/Django/glycam-django/glycamweb/static/molstar/js/
V_2/Django/glycam-django/glycamweb/static/molstar/css/

Note:
glycam_molstar.ts does not involve React, and has none of the extra controls. This is the simplest viewer.
glycam_mostar_ui.tsx does involve React, and does have the extra controls. This is currently used by the full-page viewer.
