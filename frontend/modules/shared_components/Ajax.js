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
    createTeam: function (namesArray, successCallback, errorCallback) {
        // console.log("Ajax.js| Creating team..");
        $.ajax({
            type: "POST",
            url: "http://" + config.host + ":" + config.port + "/api/createTeam",
            headers: {
                "username": localStorage.username,
                "token": localStorage.token,
                "admin": localStorage.admin
            },
            data: {
                "newTeam": namesArray
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
    }
}