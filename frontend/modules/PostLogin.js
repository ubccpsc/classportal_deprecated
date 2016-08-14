import React from 'react'
import {Spinner} from 'elemental'
import {browserHistory} from 'react-router'
import Auth from './Auth'

export default React.createClass({
  sendAuthCode: function(){
    
    // Extract the auth code from the original URL
    function getAuthCode(url, callback){
      console.log("PostLogin.js| Extracting authcode from url");
      var error = url.match(/[&\?]error=([^&]+)/);
      var code = url.match(/[&\?]code=([\w\/\-]+)/);
      if (error|| !code) {
        console.log('PostLogin.js| Error getting authcode: ' + error[1]);
        //TODO: log user out
        browserHistory.push("/");
        return;
      }
      else {
        console.log("PostLogin.js| Obtained authcode: " + code[1])
        callback(code[1]);
      }
    };
    
    function onSuccess (response) {
      //split response
      console.log("PostLogin.js| Github authentication success! Response: " + response);
      var fields = response.split('~');
      var redirect = fields[0], username = fields[1], servertoken = fields[2];

      //redirect to Registration if needed, else to portal
      if (redirect == "/register") {
        console.log("PostLogin.js| Redirecting to registration..");
        localStorage.setItem('username', username);
        localStorage.setItem('servertoken', servertoken);
        browserHistory.push("/register"); 
      }
      else if (redirect == "/") {
        console.log("PostLogin.js| Redirecting to student portal");
        localStorage.setItem('username', username);
        localStorage.setItem('servertoken', servertoken);
        browserHistory.push("/");
      }
      else if (redirect == "/admin") {
        console.log("PostLogin.js| Redirecting to student portal");
        localStorage.setItem('admin', username);
        localStorage.setItem('servertoken', servertoken);
        browserHistory.push("/admin");
      }
      else {
        //TODO: ERROR handling
      }
    };

    getAuthCode(window.location.href, function (authCode) {
      $.ajax({
        type: 'POST',
        url: 'http://localhost:4321/api/authenticate',
        data: {
          "username": "temp",
          "servertoken": "temp",
          "authCode": authCode
        },
        dataType: "json",
        success: onSuccess.bind(this),
        error: function (xhr, status, err) {
          console.log("PostLogin.js| Failed to get authcode..", xhr, status, err.toString());
        }.bind(this)
      });
    });

  },
  componentDidMount: function () {
    this.sendAuthCode();
  },
  render() {
    return (
      <div className="module">
        <h3>Connecting to Github</h3><br/><br/>
        <Spinner size="lg" type="primary"/><br/><br/>
      </div>
    )}
})