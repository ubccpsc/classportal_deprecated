To install:

```npm install``` and  ```typings install```

NPM run scripts have been set up for most common tasks:

* Clean: ```npm run clean```
* Configure: ```npm run configure```
* Test: ```npm run test``` (or ```npm test```)
* Test + coverage: ```npm run cover``` (HTML reports in ```./coverage/lcov-report/index.html```)

We are using webpack-dev-server for front-end dev, which allows front-end files to be updated live. It runs on localhost:8080.
* Run web-dev-server: ```npm run start``` (or ```npm start```)

The production server runs on localhost:4321.
* Build: ```npm run build```
* Run production server: ```NODE_ENV=production npm start```

must be global?

* mocha
* jasmine-node
* typescript


# System overview

Some docs will need to be provided to the system to set it up, these include:

* Student list; this will be a CSV with these fields: <NAME>,<STUDENT NUMBER>,<CS LAB ID>
* Deliverable list; this will be a JSON file that will look just like an array of model.Deliverable objects
