import React from 'react'
import {browserHistory } from 'react-router'

var Page = React.createClass({
  getInitialState: function() {
    return {
      authCode: '', redirect:''
    };
  },

  sendAuthCode: function () {
      // Extract the auth code from the original URL
      function getAuthCode(url){
          var error = url.match(/[&\?]error=([^&]+)/);
          if (error) {
              throw 'Error getting authorization code: ' + error[1];
          }
          return url.match(/[&\?]code=([\w\/\-]+)/)[1];
      }
      
      console.log("getting code..");
      this.state.authCode = getAuthCode(window.location.href);
      console.log("code is: " + this.state.authCode);
    
      $.ajax({
        type: 'POST',
        url: this.props.url + '/api/authenticate',
        data: {
          authCode: this.state.authCode
        },
        dataType: "json",
        success: function (response) {
          console.log("success! response: " + response);
          //first, split response
          var fields = response.split('~');
          var redirect = fields[0], username = fields[1];
          console.log("redirect: " + redirect);
          console.log("username: " + username);

          localStorage.setItem('username', username);
            
            //if we need to redirect to registration, do this
            if (redirect == "/portal") {
              console.log("redirecting to portal");
              browserHistory.push('/');
            }
            //if we already have user info, redirect to STUDENT PORTAL
            else if (redirect == "/update") {
              console.log("redirecting to registration");
              browserHistory.push("/update");
            }
          }.bind(this),
          error: function (xhr, status, err) {
            console.log("failed to get authcode.."+ this.props.url + status + err.toString());
          }.bind(this)
      });
  },

  componentDidMount: function () {
    this.sendAuthCode();
  },

  render: function () {
    return (
      <div className="page">
        <p>Loading...</p>
      </div>
    );
  }     
});

export default React.createClass({
  render() {
    return (
      <Page url="http://localhost:4321" pollInterval={2000} />
    )}
})