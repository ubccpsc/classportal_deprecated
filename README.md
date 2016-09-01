## Install

`npm install` and  `typings install`

The following NPM modules must be global?
* mocha
* jasmine-node
* typescript

## Scripts

NPM run scripts have been set up for most common tasks:

* Clean: `npm run clean`
* Configure: `npm run configure`
* Test: `npm run test`
* Test + coverage: `npm run cover` (HTML reports in `./coverage/lcov-report/index.html`)
* Run webpack-dev-server (allows live reloading of front-end code): `npm run start`
* Run production server: `npm run build` then `NODE_ENV=production npm start`

## Files Needed
In the project's root directory, a configuration file `config.json` is needed. A sample file `sample-config.json` is provided to expose the structure.

In the project's root directory, a private folder `/priv` with is needed. Refer to the sample folder `/sampleData` to get the list of files needed in `/priv`.

## System overview

Some docs will need to be provided to the system to set it up, these include:

* Student list; this will be a CSV with these fields: <NAME>,<STUDENT NUMBER>,<CS LAB ID>
* Deliverable list; this will be a JSON file that will look just like an array of model.Deliverable objects
