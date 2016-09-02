import React from 'react'
import {Spinner} from 'elemental'
import {browserHistory} from 'react-router'
import Ajax from './shared_components/Ajax'

export default React.createClass({
  getInitialState: function () {
    return { error: false };
  },
  getAuthCode: function (url, callback) {
    console.log("PostLogin.js| Extracting authcode from url..");
    
    var validAuthCode = /[?]code=([\w\/\-]+)/;
    if (validAuthCode.test(url)) {
      var authcode = url.split("code=")[1];
      console.log("PostLogin.js| Obtained authcode: " + authcode)
      callback(authcode); 
    }
    else {
      console.log('PostLogin.js| Error getting authcode from ' + url.toString());
      this.setState({ error: true }, function(){
        console.log("PostLogin.js| Redirecting to login..");
        setTimeout(function () {
          browserHistory.push("/");
        }, 2000);
      });
    }
  },
  sendAuthCode: function(){
    var that = this;
    this.getAuthCode(window.location.href, function (authcode) {
      Ajax.authenticateAuthcode(
        authcode,
        function success(response) {
          console.log("PostLogin.js| Authentication success! Response: " + response);
          var fields = response.split('~');
          var redirect = fields[0], user = fields[1], token = fields[2];

          if (redirect == "/register" || redirect == "/") {
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
            //bad login, so send back to login page
            browserHistory.push("/");
          }
        }.bind(this),
        function error(xhr, status, err) {
          console.log("PostLogin.js| Error: Bad authentication!");
          that.setState({ error: true }, function () {
              console.log("PostLogin.js| Redirecting to login..");
              setTimeout(function () {
                  browserHistory.push("/");
              }, 2000);
          });
        }.bind(this)
      )
    });
  },
  componentDidMount: function () {
    this.sendAuthCode();
  },
  render() {
    return (
      <div className="module">
        <h3>{this.state.error ? "Error! Redirecting to Login" : "Connecting to GitHub" }</h3>
        <Spinner size="lg" type="primary"/><br/><br/>        
      </div>
    )}
})
