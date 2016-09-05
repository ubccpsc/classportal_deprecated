import React from 'react'
import config from 'config';

module.exports = {
    
    /* COMMON FUNCTIONS */
    
    login: function (authcode, successCallback, errorCallback) {
        console.log("Ajax.js| Authenticating authcode..");
        $.ajax({
            type: "POST",
            url: "http://" + config.host + ":" + config.port + "/api/login",
            headers: {
                "user": "temp",
                "token": "temp",
                "admin": ""
            },
            data: {
                "authcode": authcode
            },
            dataType: "json",
            cache: false,
            success: successCallback,
            error: errorCallback
        });
    },

    //Tells server to delete the server token of the current user.
    logout: function (successCallback, errorCallback) {
        console.log("Ajax.js| Logging out..");
        $.ajax({
            type: "POST",
            url: "http://" + config.host + ":" + config.port + "/api/logout",
            headers: {
                "user": localStorage.user,
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

    register: function(sid, csid, successCallback, errorCallback) {
        console.log("Ajax.js| Registering student..");
        $.ajax({
            type: "POST",
            url: "http://" + config.host + ":" + config.port + "/api/register",
            headers: {
                "user": localStorage.user,
                "token": localStorage.token,
                "admin": ""
            },
            data: {
                "sid": sid,
                "csid": csid
            },
            dataType: 'json',
            cache: false,
            success: successCallback,
            error: errorCallback
        });
    },

    //todo: implement    
    getFilesStudent: function(successCallback, errorCallback) {
        console.log("Ajax.js| Getting all files for admin portal..");
        $.ajax({
            type: "POST",
            url: "http://" + config.host + ":" + config.port + "/api/getFilesStudent",
            headers: {
                "user": localStorage.user,
                "token": localStorage.token,
                "admin": ""
            },
            dataType: 'json',
            cache: false,
            success: successCallback,
            error: errorCallback
        });
    },
    
    //submit new team for server to create
    createTeam: function (newTeam, successCallback, errorCallback) {
        console.log("Ajax.js| Creating team..");
        $.ajax({
            type: "POST",
            url: "http://" + config.host + ":" + config.port + "/api/createTeam",
            headers: {
                "user": localStorage.user,
                "token": localStorage.token,
                "admin": localStorage.admin
            },
            data: {
                "newTeam": newTeam
            },
            dataType: "json",
            cache: false,
            success: successCallback,
            error: errorCallback
        });
    },

    
    /* ADMIN FUNCTIONS */

    //admin portal: gets all files upon login    
    getFilesAdmin: function(successCallback, errorCallback) {
        console.log("Ajax.js| Getting all files for admin portal..");
        $.ajax({
            type: "POST",
            url: "http://" + config.host + ":" + config.port + "/api/getFilesAdmin",
            headers: {
                "user": localStorage.user,
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
        console.log("Ajax.js| Submitting new class list..");
        $.ajax({
            type: "POST",
            url: "http://" + config.host + ":" + config.port + "/api/submitClasslist",
            headers: {
                "user": localStorage.user,
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

    /* SOON TO BE OBSOLETE (todo) */
    getStudent: function (successCallback, errorCallback) {
        console.log("Ajax.js| Getting students..");
        $.ajax({
            type: "POST",
            url: "http://" + config.host + ":" + config.port + "/api/getStudent",
            headers: {
                "user": localStorage.user,
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

    getDeliverables: function (successCallback, errorCallback) {
        console.log("Ajax.js| Getting deliverables..");
        $.ajax({
            type: "POST",
            url: "http://" + config.host + ":" + config.port + "/api/getDeliverables",
            headers: {
                "user": localStorage.user,
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

    getGrades: function (sid, successCallback, errorCallback) {
        console.log("Ajax.js| Getting grades..");
        $.ajax({
            type: "POST",
            url: "http://" + config.host + ":" + config.port + "/api/getGrades",
            headers: {
                "user": localStorage.user,
                "token": localStorage.token,
                "admin": localStorage.admin
            },
            data: {
                "sid": sid
            },
            dataType: "json",
            cache: false,
            success: successCallback,
            error: errorCallback
        });
    },

    getAdmin: function (successCallback, errorCallback) {
        console.log("Ajax.js| Getting admin..");
        $.ajax({
            type: "POST",
            url: "http://" + config.host + ":" + config.port + "/api/getAdmin",
            headers: {
                "user": localStorage.user,
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
    
    getStudents: function (successCallback, errorCallback) {
        console.log("Ajax.js| Getting students..");
        $.ajax({
            type: "POST",
            url: "http://" + config.host + ":" + config.port + "/api/getStudentsAdmin",
            headers: {
                "user": localStorage.user,
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

    getTeams: function (successCallback, errorCallback) {
        console.log("Ajax.js| Getting teams..");
        $.ajax({
            type: "POST",
            url: "http://" + config.host + ":" + config.port + "/api/getTeamsAdmin",
            headers: {
                "user": localStorage.user,
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

    //turn this into a helper function?
    getClasslist: function (successCallback, errorCallback) {
        console.log("Ajax.js| Getting classlist..");
        $.ajax({
            type: "POST",
            url: "http://" + config.host + ":" + config.port + "/api/getClasslist",
            headers: {
                "user": localStorage.user,
                "token": localStorage.token,
                "admin": localStorage.admin
            },
            data: {},
            dataType: "json",
            cache: false,
            success: successCallback,
            error: errorCallback
        });
    }
}