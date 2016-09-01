# ClassPortal

ClassPortal is a dynamic system for classroom management. ClassPortal helps students register for the class, associate their Github credentials, create project teams, submit documents (e.g., PDF and Zip), and view their grades. Admins can update classlists, assign grades, and initiate Github project creation code.

# Installing and Running ClassPortal

NPM run scripts have been set up for most common tasks:

* Clean: `npm run clean`
* Install: `npm install`
* Configure: `npm run configure`
* Test: `npm run test`
* Test + coverage: `npm run cover` (HTML reports in `./coverage/lcov-report/index.html`)
* Run webpack-dev-server (allows live reloading of front-end code): `npm run start:dev`
* Run production server: `npm run build` then `npm run start:prod`

## Configuring the install
In the project's root directory, a configuration file `/config.json` is needed. A sample file `/sample-config.json` is provided to expose the structure. To fully populate this file you will need to create a new Github OAuth application. You can do this here: https://github.com/settings/applications/ While creating the application, set the callback url to be  ```SERVERNAME/postlogin``` In ```/config.json``` set ```client_id``` and ```client_secret``` to the values from the OAuth page on Github.

## Storing data

In the project's root directory, a private folder `/priv` is needed. Refer to the sample folder `/sampleData` to get the list of files needed in `/priv`. Files you want to be empty (e.g., students.json, teams.json, etc.) should contain only `[]`. These files can be manually edited at runtime if needed to make changes not supported by the UI (like disbanding a team).

## System overview

Some docs will need to be provided to the system to set it up, these include:

* Student list; this will be a CSV with these fields: ```<NAME>,<STUDENT NUMBER>,<CS LAB ID>```
* Deliverable list; this will be a JSON file that will look just like an array of model.Deliverable objects.
