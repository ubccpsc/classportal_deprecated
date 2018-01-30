# DEPRECATION WARNING

This repository is deprecated; you probably want to look at:
* [ClassPortal UI](https://github.com/ubccpsc/classportal-ui)
* [ClassPortal Backend](https://github.com/ubccpsc/classportal-backend)

# ClassPortal

ClassPortal is a dynamic system for classroom management. ClassPortal helps students register for the class, associate their Github credentials, create project teams, submit documents (e.g., PDF and Zip), and view their grades. Admins can update classlists, assign grades, and initiate Github project creation code.

# Installing and Running ClassPortal

NPM run scripts have been set up for most common tasks:

* Clean: `npm run clean`
* Install: `npm install`
* Configure: `npm run configure`
* Run server: `npm run build` then `npm run start:prod`. If you are debugging you will have to relaunch this after every change (unless you can fix the command below).
* Not currently working: Run webpack-dev-server (allows live reloading of front-end code): `npm run start:dev`

If you encounter an error during `configure` you might need to install typings globally (`sudo npm install -g typings`).

If you want to run the tests you can do:

* Test: `npm run test`
* Test + coverage: `npm run cover` (HTML reports in `./coverage/lcov-report/index.html`)

If you encounter ```Error: Cannot find module 'classportal/config.json'``` it is probably because your portal is not in a directory called ```classportal``` (it is fine to have it in a subdir (like ```310portal/classportal/```).

## Configuring the install
In the project's root directory, a configuration file `/config.json` is needed. A sample file `/sample-config.json` is provided to expose the structure. To fully populate this file you will need to create a new Github OAuth application. You can do this here: https://github.com/settings/applications/ While creating the application, set the callback url to be  ```SERVERNAME/postlogin``` In ```/config.json``` set ```client_id``` and ```client_secret``` to the values from the OAuth page on Github.

You will also need a personal authentication token on Github for the Github project creation featues; go to Github -> Profile -> Personal Access Tokens and ask for lots of permissions (details to follow). Put this in the GithubController fields in config.json.

If you're configuring the data for the first time; in `/priv':

```
echo [] > tokens.json; echo [] > grades.json; echo [] > teams.json; echo [] > students.json; cp ../sampleData/deliverables.json .
```

Make sure to change `frontend/public/index.html` title tag to reflect the same code present in the `titlebar` property in `config.json` 

## Storing data

In the project's root directory, a private folder `/priv` is needed. Refer to the sample folder `/sampleData` to get the list of files needed in `/priv`. Files you want to be empty (e.g., students.json, teams.json, etc.) should contain only `[]`. These files can be manually edited at runtime if needed to make changes not supported by the UI (like disbanding a team).

## System overview

Some docs will need to be provided to the system to set it up, these include:

* Student list; this will be a CSV with these fields: ```<NAME>,<STUDENT NUMBER>,<CS LAB ID>```
* Deliverable list; this will be a JSON file that will look just like an array of model.Deliverable objects.

## Running the system

We only want to restart the system after building; this doesn't seem like it will work in the background:

Run ```./restart.sh``` on the project root directory
Make sure that the same port from `config.json` is the one in `restart.sh`

```
#!/bin/bash
port=11410
process_pid=$(netstat -anp tcp | grep $port | grep -Po '\d+\/node' | grep -Po '\d+' | sort | uniq)
echo "Process ${process_pid} found running on port ${port}"
kill -9 $process_pid
echo "Restarting"
nohup npm run start:prod&
```


# Github requirements

Sign up for an organization in Github.

Make sure you set the "Default repository permission" in the Organization setting page to "none".

Right now GithubProjectController has some hard coded fields for the organization; these should change in the future, but if they haven't, make sure they are set for your org.


To send/recieve data; go to the portal directory on the non-server machine:

To Send:
```rsync -auvp HOST:/PATHTOPORTAL/priv/ priv/```

To Receive:
```rsync -auvp priv/ HOST:PATHTOPORTAL/priv/```

### Pulling branch up to master

```
git checkout master
git merge -s ours dev_branch
git checkout dev_branch
git merge master
```

## Developing Portal

This seems like a lot of steps but should take less than 5 minutes to accomplish.

1. Configure your resources:
  * cp the `sampleData/` dir into `priv/` (`cp -r sampleData/ priv/`).
  * Add yourself to the `priv/admins.json` file if you want to use the portal as an admin. Your GitHub id should be your `username`.
  * If you want to log in as a student, you will need to set the `username` field in `students.json` to a username you can log into GitHub with.

2. Set your configuration:
  * Copy the sample config: `cp sample-config.json config.json`
  * Edit `config.json`. The only fields you will _need_ to set are `client_id` and `client_secret`, these correspond to a GitHub OAuth token. To generate thse tokens:
     1. Visit the [New Application](https://github.com/settings/applications/new) page in GitHub. 
     1. For 'Homepage URL' enter: `http://localhost:8080`. For 'Callback URL' enter: `http://localhost:8080/postlogin`.
     1. Tap Register.
     1. Copy the client id and client secret to your `config.json` file.     

3. Build and start the server
    * Clean: `npm run clean`
    * Install: `npm install`
    * Configure: `npm run configure`
    * Build code (redo aver any change to a TS file): `npm run build` 
    * Run server: `npm run start:prod`. If you are debugging you will have to relaunch this after every change.
