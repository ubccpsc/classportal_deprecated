/**
 * Created by rtholmes on 16/12/2016.
 */

import Log from "../Util";
import GitHubManager from "./GitHubManager";
import {GroupRepoDescription} from "./GitHubManager";
import {GroupCommit} from "./GitHubManager";

var gpc = new GitHubManager();

try {
    const PROJECT_PREFIX = 'cpsc310project_team';
    const TEAM_PREFIX = 'cpsc310_team';

    // const D1_PREFIX = 'cpsc310d1public_team';
    // const D1_URL = 'https://github.com/CS310-2016Fall/cpsc310d1public';

    // if no date then just do (so all commits at the same instance are considered):
    // const date = new Date();
    const date = new Date('2016-12-02T20:00:00Z'); // TS in Zulu!

    // this is the message that will be posted
    var msg = '@CPSC310bot #d3 (Automatic execution to check D3 portion of D5 test grade.)';

    // let groupDataIn: GroupRepoDescription[];

    gpc.getGroupDescriptions().then(
        function (descriptions: GroupRepoDescription[]) {
            Log.info('GitHubMakeComment() - Available teams: ' + JSON.stringify(descriptions));

            let groupsToProcess: GroupRepoDescription[] = [];
            let completeGroups: GroupRepoDescription[] = [];
            for (var descr of descriptions) {
                descr.projectName = PROJECT_PREFIX + descr.team;
                descr.teamName = TEAM_PREFIX + descr.team;

                if (typeof descr.url === 'undefined' || descr.url === null || descr.url === "") {
                    // essentially make sure the team is well formed
                    Log.info('GitHubMakeComment() - Prepared Team: ' + JSON.stringify(descr));
                    groupsToProcess.push(descr);
                } else {
                    Log.info('GitHubMakeComment() - Skipped Team: ' + JSON.stringify(descr));
                    completeGroups.push(descr);
                }
            }

            // set the index for available teams (used by timeout back off)
            for (var i = 0; i < groupsToProcess.length; i++) {
                let grp = groupsToProcess[i];
                grp.teamIndex = i;
            }

            Log.info("GitHubMakeComment() - # Complete teams: " + completeGroups.length);
            Log.info('GitHubMakeComment() - # Teams to process: ' + groupsToProcess.length);
            Log.info("GitHubMakeComment() - Teams to process: " + JSON.stringify(completeGroups.length));

            let processList: Promise<GroupCommit>[] = [];

            for (var toProcess of completeGroups) {
                processList.push(<any>gpc.getLastSHA("CS310-2016Fall", toProcess.projectName, date));
            }

            return Promise.all(processList);
        }).then(function (commits: GroupCommit[]) {


        Log.info('GitHubMakeComment - processList tasks complete; #: ' + commits.length);
        var commentList: any[] = [];

        var count = 0;
        for (var commit of commits) {
            count++;
            let delay = count * 1 * 60 * 1000;
            Log.info("GitHubMakeComment - Ready to make comment on repo: " + commit.repoName + "; sha: " + commit.sha + "; delay: " + (delay / 1000 / 60 / 60).toFixed(2) + ' hours');

            commentList.push(gpc.makeCommitComment("CS310-2016Fall", commit.repoName, commit.sha, msg, delay));
        }
        return Promise.all(commentList);

    }).then(function (processedRepos: GroupRepoDescription[]) {
        Log.info("GitHubMakeComment() - Process complete for # projects: " + processedRepos.length);

        for (var repo of processedRepos) {
            Log.info("GitHubMakeComment() - Repo: " + repo.url);
        }
        Log.info("GitHubMakeComment() - Done.");
    }).catch(function (err: any) {
            Log.error('GitHubMakeComment() - ERROR processing project comment chain: ' + err);
        }
    );
} catch (err) {
    Log.error('GitHubMakeComment() - caught ERROR: ' + err);
}