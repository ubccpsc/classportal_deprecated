To install:

```npm install```

NPM run scripts have been set up for most common tasks:

* Clean: ```npm run clean```
* Configure: ```npm run configure```
* Build: ```npm run build```
* Test: ```npm run test``` (or ```npm test```)
* Test + coverage: ```npm run cover``` (HTML reports in ```./coverage/lcov-report/index.html```)
* Run Server: ```npm run start``` (or ```npm start```)


must be global?

* mocha
* jasmine-node
* typescript


# System overview

Some docs will need to be provided to the system to set it up, these include:

* Student list; this will be a CSV with these fields: <NAME>,<STUDENT NUMBER>,<CS LAB ID>
* Deliverable list; this will be a JSON file that will look just like an array of model.Deliverable objects