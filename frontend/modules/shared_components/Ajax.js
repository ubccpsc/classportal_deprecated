import React from 'react'
import Config from 'Config';

module.exports = {
    getStudent: function (successCallback, errorCallback) {
        console.log("Ajax.js| Getting students..");
        $.ajax({
            type: 'POST',
            url: 'http://' + Config.host + ':' + Config.port + '/api/getStudent',
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
            type: 'POST',
            url: 'http://' + Config.host + ':' + Config.port + '/api/getDeliverables',
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
            type: 'POST',
            url: 'http://' + Config.host + ':' + Config.port + '/api/getGrades',
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

    //Tells server to delete the server token of the current user.     
    logout: function (successCallback, errorCallback) {
        console.log("Ajax.js| Logging out..");
        $.ajax({
            type: "POST",
            url: 'http://' + Config.host + ':' + Config.port + '/api/logout',
            headers: {
                "user": localStorage.user,
                "token": localStorage.token,
                "admin": localStorage.admin
            },
            data: {},
            dataType: 'json',
            cache: false,
            success: successCallback,
            error: errorCallback
        });
    }
}