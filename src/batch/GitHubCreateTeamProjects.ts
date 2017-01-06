/**
 * Created by rtholmes on 16/12/2016.
 */


import Log from "../Util";
import GitHubManager from "./GitHubManager";
import {GroupRepoDescription} from "./GitHubManager";

/**
 * Steps required to configure a course. The first 1-7 are all async.
 *
 * 0. Get the data about the github usernames, repos, and teams.
 * 1. Create N project repos.
 * 2. Import base repo into each project repo. (optional; often helpful for getting started)
 * 3. Add webhook to each project repo. (optional; needed for autotest)
 * 4. Create M student teams.
 * 5. Add the right students to each team.
 * 6. Add the student team to the project repo.
 * 7. Add the course staff team to the project repo.
 * 8. Report back what has been created.
 *
 * @type {GitHubManager}
 */

// organization name
// const ORG_NAME = 'CS410-2015Fall';
// const ORG_NAME = 'CS310-2016Fall';
const ORG_NAME = 'CS310-2017Jan';

// all projects will start with this (e.g., cpsc310project_team12)
const PROJECT_PREFIX = 'cpsc310project_team';

// all teams will start with this (e.g., cpsc310_team12)
const TEAM_PREFIX = 'cpsc310_team';

// the team containing all of the TAs
const STAFF_TEAM = '310staff';

// the endpoint for AutoTest (null if you do not want these)
const WEBHOOK_ENDPOINT = 'http://skaha.cs.ubc.ca:11311/submit';

// this is the
const IMPORTURL = 'https://github.com/CS310-2017Jan/bootstrap';

// if we want to delete projects instead of creating them. be careful with this!
const CLEAN = false;

var gpc = new GitHubManager(ORG_NAME);

try {
    gpc.getGroupDescriptions().then(
        function (descriptions) {
            Log.info('ProvisioningMain() - Available teams: ' + JSON.stringify(descriptions));


            // won't normally need this
            //var testGroup: GroupRepoDescription = {team: 1, members: ['rthse2', 'mksarge']};
            //descriptions.push(testGroup);

            let groupsToProcess: GroupRepoDescription[] = [];
            let completeGroups: GroupRepoDescription[] = [];
            for (var descr of descriptions) {
                descr.projectName = PROJECT_PREFIX + descr.team;
                descr.teamName = TEAM_PREFIX + descr.team;

                if (CLEAN) {
                    Log.info('ProvisioningMain() - Team to Clean: ' + JSON.stringify(descr));
                    groupsToProcess.push(descr);
                } else {
                    //if (descr.team === 1) {
                    if (typeof descr.url === 'undefined' || descr.url === null || descr.url === "") {
                        // if (descr.url.length > 5) { // for all provisioned repos
                        Log.info('ProvisioningMain() - Prepared Team: ' + JSON.stringify(descr));
                        groupsToProcess.push(descr);
                    } else {
                        Log.info('ProvisioningMain() - Skipped Team: ' + JSON.stringify(descr));
                        // Log.info('ProvisioningMain() - Team Repo Created: ' + descr.team);
                        completeGroups.push(descr);
                    }
//                    }
                }
            }

            // set the index for available teams (used by timeout backoff)
            for (var i = 0; i < groupsToProcess.length; i++) {
                let grp = groupsToProcess[i];
                grp.teamIndex = i;
            }

            Log.info("ProvisioningMain() - # Complete teams: " + completeGroups.length);
            Log.info('ProvisioningMain() - # Teams to process: ' + groupsToProcess.length);
            Log.info("ProvisioningMain() - Teams to process: " + JSON.stringify(completeGroups.length));

            let processList: GroupRepoDescription[] = []; // this is really Promise<GroupRepoDescription>[]
            for (var toProcess of groupsToProcess) {

                if (CLEAN) {
                    // clean instead of provision
                    processList.push(<any>gpc.completeClean(toProcess));
                } else {
                    // new project
                    processList.push(<any>gpc.completeTeamProvision(toProcess, IMPORTURL, STAFF_TEAM, WEBHOOK_ENDPOINT));

                    // test suite
                    // processList.push(<any>gpc.provisionRepo(toProcess, D1_PREFIX + toProcess.team, D1_URL));
                }
            }

            return Promise.all(processList);

        }).then(function (provisionedRepos: GroupRepoDescription[]) {

        Log.info("ProvisioningMain() - Process complete for # projects: " + provisionedRepos.length);

        for (var repo of provisionedRepos) {
            Log.info("ProvisioningMain() - Repo: " + repo.url);
        }
        Log.info("ProvisioningMain() - Done.");
    }).catch(function (err: any) {
            Log.error('ProvisioningMain() - ERROR processing project creation chain: ' + err);
        }
    );
} catch (err) {
    Log.error('ProvisioningMain() - caught ERROR: ' + err);
}


/*
// TODO: need to get this from Manager
let groupDataIn: GroupRepoDescription[];
// for debugging
groupDataIn.push({team: 999, members: ['rtholmes', 'rthse2']});

let groupData: GroupRepoDescription[] = [];
for (var gd of groupDataIn) {
    if (typeof gd.url === 'undefined' || gd.url === null) {
        gd.teamName = TEAM_PREFIX + gd.team;
        gd.projectName = PROJECT_PREFIX + gd.team;
        groupData.push(gd);
    }
}


// let repoList: string[] = [];
// for (var i = 0; i < 3; i++) {
//     repoList.push('cpsc310test_team' + i);
// }
//
//
//
// // only for deleting repos
// var promises: Promise<any>[] = [];
// for (var data of groupData) {
//     let repoName = PROJECT_PREFIX + data.team;
//     promises.push(gpc.deleteRepo(repoName));
// }
// Promise.all(promises).then(function (succ) {
//     Log.info('all projects deleted: ' + succ);
// }).catch(function (err) {
//     Log.error('Error deleting projects: ' + err);
// });



// create the repos
gpc.createAllRepos(groupData).then(function (res) {
    Log.info('All repos created: ' + JSON.stringify(res));
}).catch(function (err) {
    Log.error('Error creating repos: ' + JSON.stringify(err));
});

// import the default project to the repos
// let importUrl = 'https://github.com/CS310-2016Fall/cpsc310project';
gpc.importAllRepos(groupData, IMPORTURL).then(function (res) {
    Log.info('All repos importing: ' + JSON.stringify(res));
}).catch(function (err) {
    Log.error('Error importing repos: ' + JSON.stringify(err));
});

// create the teams and add the members to them
const TEAM_PERMISSIONS = 'push';
gpc.createAllTeams(groupData, TEAM_PERMISSIONS ).then(function (res) {
    Log.info('All teams created: ' + JSON.stringify(res));

    let promises: Promise<any>[] = [];
    for (var teamRec of res) {
        let id = teamRec.teamId;
        let name = teamRec.teamName;
        for (var gd of groupData) {
            if (gd.teamName === name) {
                promises.push(gpc.addMembersToTeam(id, gd.members));
            }
        }
    }
    return Promise.all(promises);
}).then(function (teamsDone) {
    Log.info('All members successfully added to teams: ' + JSON.stringify(teamsDone));
}).catch(function (err: any) {
    Log.error('Error creating teams: ' + err);
});


// add the teams to the repos
const STAFF_PERMISSIONS = 'admin';
gpc.addTeamToRepos(groupData, '310Staff', STAFF_PERMISSIONS).then(function (res) {
    Log.info('Adding team to repos success: ' + JSON.stringify(res));
}).catch(function (err: any) {
    Log.info('Error adding team to repos: ' + err);
});

} catch (err) {
Log.error('ProvisioningMain() - caught ERROR: ' + err);
}
*/