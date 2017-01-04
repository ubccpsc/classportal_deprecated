import React from 'react'
import config from 'config';

module.exports = {
    login: function (csid, sid, authcode, successCallback, errorCallback) {
        // console.log("Ajax.js| Authenticating authcode..");
        $.ajax({
            type: "POST",
            url: "http://" + config.host + ":" + config.port + "/api/login",
            headers: {
                "username": "temp",
                "token": "temp",
                "admin": ""
            },
            data: {
                "csid": csid,
                "sid": sid,
                "authcode": authcode
            },
            dataType: "json",
            cache: false,
            success: successCallback,
            error: errorCallback
        });
    },
    register: function (csid, sid, successCallback, errorCallback) {
        // console.log("Ajax.js| Checking if student exists in database..");
        $.ajax({
            type: "POST",
            url: "http://" + config.host + ":" + config.port + "/api/register",
            headers: {
                "username": "temp",
                "token": "temp",
                "admin": ""
            },
            data: {
                "csid": csid,
                "sid": sid
            },
            dataType: 'json',
            cache: false,
            success: successCallback,
            error: errorCallback
        });
    },
    //delete server token of the current username.
    logout: function (successCallback, errorCallback) {
        // console.log("Ajax.js| Logging out..");
        $.ajax({
            type: "POST",
            url: "http://" + config.host + ":" + config.port + "/api/logout",
            headers: {
                "username": localStorage.username,
                "token": localStorage.token,
                "admin": localStorage.admin
            },
            data: {},
            dataType: "json",
            cache: false,
            success: successCallback,
            error: errorCallback
        });
    },
    loadStudentPortal: function (successCallback, errorCallback) {
        // console.log("Ajax.js| Getting all files for admin portal..");
        $.ajax({
            type: "POST",
            url: "http://" + config.host + ":" + config.port + "/api/loadStudentPortal",
            headers: {
                "username": localStorage.username,
                "token": localStorage.token,
                "admin": ""
            },
            dataType: 'json',
            cache: false,
            success: successCallback,
            error: errorCallback
        });
    },
    //submit new team to be created
    createTeam: function (namesArray, appName, appDescription, successCallback, errorCallback) {
        // console.log("Ajax.js| Creating team..");
        var teamData = { "newTeam": namesArray };
        if (typeof appName !== "undefined" && 
            typeof url !== "undefined" && 
            typeof appDescription !== "undefined") {
            teamData['appName'] = appName;
            teamData['appDescription'] = appDescription;
        }
        
        $.ajax({
            type: "POST",
            url: "http://" + config.host + ":" + config.port + "/api/createTeam",
            headers: {
                "username": localStorage.username,
                "token": localStorage.token,
                "admin": localStorage.admin
            },
            data: teamData,
            dataType: "json",
            cache: false,
            success: successCallback,
            error: errorCallback
        });
    },
    //submit new team to be disbanded
    disbandTeam: function (teamId, successCallback, errorCallback) {
        // console.log("Ajax.js| Disbanding team..");
        $.ajax({
            type: "POST",
            url: "http://" + config.host + ":" + config.port + "/api/disbandTeam",
            headers: {
                "username": localStorage.username,
                "token": localStorage.token,
                "admin": localStorage.admin
            },
            data: {
                "teamId": teamId
            },
            dataType: "json",
            cache: false,
            success: successCallback,
            error: errorCallback
        });
    },
    assignTeam: function (newTA, teamId, successCallback, errorCallback) {
        // console.log("Ajax.js| Assigning new TA to team");
        $.ajax({
            type: "POST",
            url: "http://" + config.host + ":" + config.port + "/api/assignTeam",
            headers: {
                "username": localStorage.username,
                "token": localStorage.token,
                "admin": localStorage.admin
            },
            data: {
                "newTA": newTA,
                "teamId": teamId
            },
            dataType: "json",
            cache: false,
            success: successCallback,
            error: errorCallback
        });
    },
    //admin portal: gets all files upon login    
    loadAdminPortal: function (successCallback, errorCallback) {
        // console.log("Ajax.js| Getting all files for admin portal..");
        $.ajax({
            type: "POST",
            url: "http://" + config.host + ":" + config.port + "/api/loadAdminPortal",
            headers: {
                "username": localStorage.username,
                "token": localStorage.token,
                "admin": localStorage.admin
            },
            dataType: 'json',
            cache: false,
            success: successCallback,
            error: errorCallback
        });
    },
    //admin portal: send new classlist.csv to server 
    submitClasslist: function (formData, successCallback, errorCallback) {
        // console.log("Ajax.js| Submitting new class list..");
        $.ajax({
            type: "POST",
            url: "http://" + config.host + ":" + config.port + "/api/submitClasslist",
            headers: {
                "username": localStorage.username,
                "token": localStorage.token,
                "admin": localStorage.admin
            },
            data: formData,
            cache: false,
            contentType: false,
            processData: false,
            success: successCallback,
            error: errorCallback
        });
    },
    submitGrade: function (sid, assnId, grade, comment, successCallback, errorCallback) {
        // console.log("Ajax.js| Submitting new grade..");
        $.ajax({
            type: "POST",
            url: "http://" + config.host + ":" + config.port + "/api/submitGrade",
            headers: {
                "username": localStorage.username,
                "token": localStorage.token,
                "admin": localStorage.admin
            },
            data: {
                "sid": sid,
                "assnId": assnId,
                "grade": grade,
                "comment": comment
            },
            dataType: "json",
            cache: false,
            success: successCallback,
            error: errorCallback
        });
    },
    submitComment: function (appID, ratting, comment, successCallback, errorCallback) {
        // console.log("Ajax.js| Submitting new grade..");
        $.ajax({
            type: "POST",
            url: "http://" + config.host + ":" + config.port + "/api/submitComment",
            headers: {
                "username": localStorage.username,
                "token": localStorage.token
            },
            data: {
                "appID": appID,
                "ratting": ratting,
                "comment": comment
            },
            dataType: "json",
            cache: false,
            success: successCallback,
            error: errorCallback
        });
    },
    submitAllGrades: function (studentGrades, successCallback, errorCallback) {
        // console.log("Ajax.js | Submitting news grades...");
        $.ajax({
            type: "POST",
            url: "http://" + config.host + ":" + config.port + "/api/submitGrades",
            headers: {
                "username": localStorage.username,
                "token": localStorage.token,
                "admin": localStorage.admin
            },
            data: { "student" : studentGrades},
            dataType: "json",
            cache: false,
            success: successCallback,
            error: errorCallback
        });
    },
    updateComments: function (appID, comments, successCallback, errorCallback) {
        // console.log("Ajax.js | Submitting news grades...");
        console.log(appID);
        console.log(comments);
        $.ajax({
            type: "POST",
            url: "http://" + config.host + ":" + config.port + "/api/updateComments",
            headers: {
                "username": localStorage.username,
                "token": localStorage.token,
                "admin": localStorage.admin
            },
            data: { 
                "appID": appID,
                "comments": comments
            },
            dataType: "json",
            cache: false,
            success: successCallback,
            error: errorCallback
        });
    }
}