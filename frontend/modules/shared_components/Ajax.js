import React from 'react'
import config from 'config';

module.exports = {
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

    //Input: data = sid
    getGrades: function (data, successCallback, errorCallback) {
        console.log("Ajax.js| Getting grades..");
        $.ajax({
            type: "POST",
            url: "http://" + config.host + ":" + config.port + "/api/getGrades",
            headers: {
                "user": localStorage.user,
                "token": localStorage.token,
                "admin": localStorage.admin
            },
            data: data,
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
    
    getClassList: function (successCallback, errorCallback) {
        console.log("Ajax.js| Getting classlist..");
        $.ajax({
            type: "POST",
            url: "http://" + config.host + ":" + config.port + "/api/getClassList",
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

    //submit 2 students, expects server to form team and update their student objects.
    createTeam: function (data, successCallback, errorCallback) {
        console.log("Ajax.js| Creating team..");
        $.ajax({
            type: "POST",
            url: "http://" + config.host + ":" + config.port + "/api/createTeam",
            headers: {
                "user": localStorage.user,
                "token": localStorage.token,
                "admin": localStorage.admin
            },
            data: data,
            dataType: "json",
            cache: false,
            success: successCallback,
            error: errorCallback
        });
    },

    //send csv
    submitClassList: function (formData, successCallback, errorCallback) {
        console.log("Ajax.js| Submitting new class list..");
        $.ajax({
            type: "POST",
            url: "http://" + config.host + ":" + config.port + "/api/submitClassList",
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

    authenticateAuthcode: function (authcode, successCallback, errorCallback) {
        console.log("Ajax.js| Authenticating authcode..");
        $.ajax({
            type: "POST",
            url: "http://" + config.host + ":" + config.port + "/api/authenticate",
            headers: {
                "user": "temp",
                "token": "temp"
            },
            data: {
                "authcode": authcode
            },
            dataType: "json",
            cache: false,
            success: successCallback,
            error: errorCallback
        });
    }
}