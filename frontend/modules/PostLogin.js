import React from 'react'
import {Spinner} from 'elemental'
import {browserHistory} from 'react-router'

export default React.createClass({
  getInitialState: function () {
    return { error: false };
  },
  sendAuthCode: function(){
    function onSuccess (response) {
      console.log("PostLogin.js| Authentication success! Response: " + response);
      var fields = response.split('~');
      var redirect = fields[0], user = fields[1], token = fields[2];

      if (redirect == ("/register" || "/")) {
        console.log("PostLogin.js| Student login! Redirecting..");
        localStorage.setItem('user', user);
        localStorage.setItem('token', token);
        browserHistory.push(redirect); 
      }
      else if (redirect == "/admin") {
        console.log("PostLogin.js| Admin login! Redirecting..");
        localStorage.setItem('user', user);
        localStorage.setItem('token', token);
        localStorage.setItem('admin', true);
        browserHistory.push("/admin");
      }
      else {
        browserHistory.push("/");
      }
    }

    // Extract the auth code from the original URL
    function getAuthCode(url, callback){
      console.log("PostLogin.js| Extracting authcode from url..");
      var validAuthCode = /[?]code=([\w\/\-]+)/;
      
      if (validAuthCode.test(url)) {
        var authcode = url.split("code=")[1];
        console.log("PostLogin.js| Obtained authcode: " + authcode)
        callback(authcode); 
      }
      else {
        console.log('PostLogin.js| Error getting authcode from ' + url.toString());
        that.setState({ error: true }, function(){
          console.log("PostLogin.js| Redirecting to login..");
          setTimeout(function () {
            browserHistory.push("/");
          }, 2000);
        });
      }
    }
    
    var that = this;
    getAuthCode(window.location.href, function (authCode) {
      console.log("PostLogin.js| Authenticating..");
      $.ajax({
        type: 'POST',
        url: 'http://localhost:4321/api/authenticate',
        data: {
          "user": {
            "name": "temp",
            "token": "temp"
          },
          "authCode": authCode
        },
        dataType: "json",
        success: onSuccess.bind(this),
        error: function (xhr, status, err) {
          console.log("PostLogin.js| Error: Bad authentication!");
          that.setState({ error: true }, function(){
            console.log("PostLogin.js| Redirecting to login..");
            setTimeout(function () {
              browserHistory.push("/");
            }, 2000);
          });
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
        <h3>{this.state.error ? "Error! Redirecting to Login" : "Connecting to Github" }</h3><br/><br/>
        <Spinner size="lg" type="primary"/><br/><br/>        
      </div>
    )}
})