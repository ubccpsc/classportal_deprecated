/**
 * Created by rtholmes on 2016-10-28.
 */

import Log from "../Util";
var request = require('request');
var config = require('../../config.json');
var rp = require('request-promise-native');

import {Helper} from "../Util";
import async = require('async');
import _ = require('lodash');
import fs = require('fs');
import GitHubManager from "./GitHubManager";

const pathToRoot = __dirname.substring(0, __dirname.lastIndexOf('classportal/')) + 'classportal/';


export default class RedeliverWebhook {

    public redeliver(orgName: string, repoName: string) {
        Log.info('redeliver( ' + orgName + ', ' + repoName + ' )');
        var m = new GitHubManager(orgName);
        m.redeliverWebhook(repoName).then(function (out: any) {
            Log.info('Redelivery complete.');
        }).catch(function (err: any) {
            Log.info('Redelivery error: ' + err.message);
        });
    }
}


if (process.argv.length < 2) {
    Log.warn("node src/batch/RedeliverWebook <TEAM NUMBER>");
} else {
    let teamNum = process.argv[2];

    const ORG_NAME = 'CS310-2017Jan';
    const PREFIX = 'cpsc310project_team';

    var rwh = new RedeliverWebhook();
    rwh.redeliver(ORG_NAME, PREFIX + teamNum);
}
