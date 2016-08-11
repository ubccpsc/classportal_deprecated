import React from 'react'
import {Spinner} from 'elemental'
import {browserHistory} from 'react-router'
import Auth from './Auth'

export default React.createClass({
  sendAuthCode: function(){
    function onSuccess (response) {
      //split response
      console.log("success! response: " + response);
      var fields = response.split('~');
      var redirect = fields[0], username = fields[1], servertoken = fields[2];

      //redirect to Registration if needed, else to portal
      if (redirect == "/register") {
        console.log("redirecting to registration");
        localStorage.setItem('username', username);
        localStorage.setItem('servertoken', servertoken);
        browserHistory.push("/register"); 
      }
      else if (redirect == "/") {
        console.log("redirecting to portal");
        localStorage.setItem('username', username);
        localStorage.setItem('servertoken', servertoken);
        browserHistory.push("/");
      }
      else {
        //TODO: ERROR handling
      }
    }
    
    // Extract the auth code from the original URL
    function getAuthCode(url){
      console.log(url);
      var error = url.match(/[&\?]error=([^&]+)/);
      console.log(error);
      var code = url.match(/[&\?]code=([\w\/\-]+)/);
      console.log(code);
      console.log(error);
      if (error) {
        throw 'Error getting authorization code: ' + error[1];
      } else if (!code) {
        console.log("no code!")
        return;
      } else {
        console.log("good code!")
        return code[1];
      }   
    }
    
    console.log("getting code..");
    var authCode = getAuthCode(window.location.href);
    console.log(authCode);
    if (authCode == null) {
      console.log("error");
      browserHistory.push("/");
      return;
    } else {
      console.log("code is: " + authCode);
      $.ajax({
        type: 'POST',
        url: 'http://localhost:4321/api/authenticate',
        data: {
          servertoken:"temp",
          authCode: authCode
        },
        dataType: "json",
        success: onSuccess.bind(this),
        error: function (xhr, status, err) {
          console.log("failed to get authcode..", xhr, status, err.toString());
        }.bind(this)
      });
    }
  },
  componentDidMount: function () {
    this.sendAuthCode();
  },
  render() {
    return (
      <div className="module">
        <Spinner size="lg" />
      </div>
    )}
})