// modules/Login.js
import React from 'react'
import { Glyph, Col, Row, Button, Alert, Spinner } from 'elemental'

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
  
  componentDidMount: function () {
    this.setState({ github: localStorage.username }, function () {
      //lesson learned: use a callback containing the function you want to pass, do not
      //pass the function directly!! Why?
      this.getUserInfo();
      
      //async
      this.setState({ loggedIn: true });
    });
  },
  render: function () {
    return (
      <div id="LoginBar">
        {this.state.loggedIn
          ? (
            <div>
              <p>Logged in as {this.state.firstname} {this.state.lastname}</p>
              <Button>Log out<Glyph icon="log-out"/></Button>
            </div>
            )
          : (<p>Log In</p>)
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