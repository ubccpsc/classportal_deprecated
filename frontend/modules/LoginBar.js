// modules/Login.js
import React from 'react'
import {Login, GithubComponent} from './Login'
import { Form, FormField, Glyph, Col, Row, Button, Alert, Spinner } from 'elemental'

var LoginBar = React.createClass({
  getInitialState: function() {
    return {
      github:'',
      firstname:'',
      lastname: '',
      loggedIn: false
    };
  },

  getUserInfo: function () {
    console.log("using " + this.state.github + " to request other info:");
    $.ajax({
      url: this.props.url + '/api/getUserInfo/'+this.state.github,
      method: "GET",
      dataType: 'json',
      cache: false,
      success: function(data) {
        console.log("Response:  " + JSON.stringify(data));
        this.setState({ firstname: data.firstname });
        this.setState({ lastname: data.lastname });
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  
  logoutSubmit: function (e) {
    e.preventDefault();
    console.log("LOGGED OUT");
    localStorage.removeItem("username");
    this.setState({ loggedIn: false });

    //also need to clear all variables in the app
  },

  componentDidMount: function () {
    //polling for login status update. Better way??
    //YES! USE REACT EVENT SYSTEM.
    setInterval(dothis, 2000);
    let that = this;

    function dothis() {
      if (!!localStorage.username) {
        that.setState({ github: localStorage.username }, function () {
          //lesson learned: use a callback containing the function you want to pass, do not
          //pass the function directly!! Why?
          that.getUserInfo();

          //async
          that.setState({ loggedIn: true });
        }); 
      }  
    }
  },
  render: function () {
    return (
      <div id="LoginBar">
        {this.state.loggedIn ? (
            <div>
            <Form onSubmit={this.logoutSubmit}>
              <FormField>Logged in as {this.state.firstname} {this.state.lastname}
                <Button submit><Glyph icon="log-out"/> | Log out</Button>
              </FormField>
            </Form>
            </div>)
          : (<GithubComponent/>)
        }
      </div>
    );
  }     
});

export default React.createClass({
  render() {
    return (
      <LoginBar url="http://localhost:4321"/>
    )}
})