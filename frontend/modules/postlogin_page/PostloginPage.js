import React from 'react'
import {Spinner} from 'elemental'
import {browserHistory} from 'react-router'
import Ajax from '../shared_components/Ajax'

export default React.createClass({
  getInitialState: function () {
    return { error: false };
  },
  getAuthCode: function (url, callback) {
    var validAuthCode = /[?]code=([\w\/\-]+)/;
    if (validAuthCode.test(url)) {
      var authcode = url.split("code=")[1];
      // console.log("PostLogin.js| Obtained authcode: " + authcode)
      callback(authcode);
    }
    else {
      this.setState({ error: true }, function () {
        // console.log("PostLogin.js| Error: redirecting to login..");
        setTimeout(function () {
          browserHistory.push("/");
        }, 2000);
      });
    }
  },
  sendAuthCode: function () {
    this.getAuthCode(window.location.href, function (authcode) {
      Ajax.login(
        localStorage.csid ? localStorage.csid : "",
        localStorage.sid ? localStorage.sid : "",
        authcode,
        function success(response) {
          // console.log("PostLogin.js| Authentication success! Response: " + JSON.stringify(response));
          var admin = response.admin;
          var username = response.username;
          var token = response.token;

          //clear any previously saved values in localstorage
          localStorage.clear();

          if (!!username & !!token) {
            if (admin === true) {
              // console.log("PostLogin.js| Admin login! Redirecting..");
              localStorage.setItem('username', username);
              localStorage.setItem('token', token);
              localStorage.setItem('admin', "true");
              browserHistory.push("/admin");
            }
            else {
              // console.log("PostLogin.js| Student login! Redirecting..");
              localStorage.setItem('username', username);
              localStorage.setItem('token', token);
              browserHistory.push("/");
            }
          }
          else {
            //bad login, so send back to login page
            this.setState({ error: true }, function () {
              console.log("Login failed! Redirecting..");
              setTimeout(function () {
                browserHistory.push("/");
              }, 2500);
            });
          }
        }.bind(this),
        function error(xhr, status, err) {
          //clear student info set by register process
          localStorage.clear();

          //before redirect, let user know why they could not log in.
          //todo: get error message from server response instead of hard-coding it
          alert("Error: ");

          //display error message for 3 seconds before redirecting to login
          this.setState({ error: true }, function () {
            console.log("Login failed! Redirecting..");
            setTimeout(function () {
              browserHistory.push("/");
            }, 2500);
          });
        }.bind(this)
      )
    }.bind(this));
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
    )
  }
})
