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
        console.log("Ajax.js| Getting deliverables");
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

    getGrades: function (successCallback, errorCallback) {
        $.ajax({
            type: 'POST',
            url: 'http://' + Config.host + ':' + Config.port + '/api/getGrades',
            headers: {
                "user": localStorage.user,
                "token": localStorage.token,
                "admin": localStorage.admin
            },
            data: {
                "sid": this.state.studentObject.sid
            },
            dataType: "json",
            cache: false,
            success: successCallback,
            error: errorCallback
        });
    }    
}