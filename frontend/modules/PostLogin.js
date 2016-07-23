import React from 'react'
import {browserHistory } from 'react-router'

var Page = React.createClass({
  getInitialState: function() {
    return {
      authCode: '', redirect:''
    };
  },
  getCode: function () {
      // Extract the auth code from the original URL
      function getAuthCode(url){
          var error = url.match(/[&\?]error=([^&]+)/);
          if (error) {
              throw 'Error getting authorization code: ' + error[1];
          }
          return url.match(/[&\?]code=([\w\/\-]+)/)[1];
      }
      
      console.log("getting code..");
      // Get the authorization code from the url that was returned by GitHub
      this.state.authCode = getAuthCode(window.location.href);
      console.log("code is: " + this.state.authCode);

      var saveData = $.ajax({
          type: 'POST',
          url: this.props.url + '/api/authenticate',
          data: {
            authCode: this.state.authCode
          },
          dataType: "json",
          success: function (resp) {
            console.log("success!");
            console.log(resp);
            browserHistory.push(resp);
          }.bind(this),
          error: function (xhr, status, err) {
            console.log("fail!");
            console.error(this.props.url);
            console.error(status);
            console.error(err.toString());
          }.bind(this)
      });
      console.log("sent authcode to server. waiting to redirect.");
  },
  componentDidMount: function () {
    console.log("yass");
    this.getCode();
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