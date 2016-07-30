import React from 'react'
import {browserHistory } from 'react-router'
import {Row,Col,Form,FormField,Button,FormInput,Checkbox } from 'elemental'
  
var Page = React.createClass({
  getInitialState: function () {
    return {
      sid:'',
      csid:'',
      firstname:'',
      lastname:'',
      email:'',
      github: '',
      data:[]
    };
  },

  getUserInfo: function () {
    $.ajax({
      url: this.props.url + '/api/getUserInfo/'+this.state.github,
      method: "GET",
      dataType: 'json',
      cache: false,
      success: function(data) {
        console.log("Response:  " + JSON.stringify(data));
        this.setState({ sid: data.sid });
        this.setState({ csid: data.csid });
        this.setState({ firstname: data.firstname });
        this.setState({ lastname: data.lastname });
        this.setState({ email: data.email });
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },

  handleUpdate: function (event) {
    event.preventDefault();
    
    /* need to figure out how to do arrays in react..
    for (index = 0; index < event.target.elements.length; i++){
      if (!!event.target.elements[index].value) {
            this.setState({ data[index]: event.target.elements[index].value });  
      }    
    }*/

    if (!!event.target.elements[0].value)
      this.setState({ firstname: event.target.elements[0].value });  
    if (!!event.target.elements[1].value)
      this.setState({ lastname: event.target.elements[1].value });
    if (!!event.target.elements[2].value)
      this.setState({ sid: event.target.elements[2].value });
    if (!!event.target.elements[3].value)
      this.setState({ csid: event.target.elements[3].value });
    if (!!event.target.elements[4].value)
      this.setState({ email: event.target.elements[4].value });
    
  },

  handleSubmit: function (event) {
    event.preventDefault();
    
    var dataObj = {
      "sid": event.target.elements[2].value,
      "csid": event.target.elements[3].value,
      "firstname": event.target.elements[0].value,
      "lastname": event.target.elements[1].value,
      "email": event.target.elements[4].value
    };
    
    var dataObj2 = {
      "sid": this.state.sid,
      "csid": this.state.csid,
      "firstname": this.state.firstname,
      "lastname": this.state.lastname,
      "email": this.state.email
    };

    $.ajax({
      url: this.props.url + '/api/updateUserInfo/'+this.state.github,
      type: "POST",
      data: dataObj,
      dataType: 'json',
      cache: false,
      success: function(data) {
        browserHistory.push(data);
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },

  // Extract the auth code from the original URL
  getUsername: function(url){
          var error = url.match(/[&\?]error=([^&]+)/);
          if (error) {
              throw 'Error getting authorization code: ' + error[1];
          }
          return url.match(/[&\?]user=([\w\/\-]+)/)[1];
  },
  
  componentDidMount: function () {
    this.setState({ github: localStorage.username }, function () {
      this.getUserInfo();
    });
  },

  render: function () {
    return (
      <div className="module">
        <p>Please update your student info below.</p>  
        <h4>GitHub user: {this.state.github}</h4>
        <Form onSubmit={this.handleSubmit} className="form">
          <FormField>
            <FormInput autoFocus placeholder="First name"/>
            <FormInput placeholder="Last name"/>
            <FormInput placeholder="Student number"/>
            <FormInput placeholder="CS ID"/>
            <FormInput placeholder="Email"/>
          </FormField>
          <Button submit>Update</Button>
        </Form>  
      </div>
    );
  }
})

export default React.createClass({
  render() {
    return (
      <Page url="http://localhost:4321" pollInterval={2000} />
    )}
})

/*

        <p id="userInfo">
          first name: {this.state.firstname}<br/>
          last name: {this.state.lastname}<br/>
          student #: {this.state.sid} <br/>
          cs id: {this.state.csid}<br/>
          email: {this.state.email}<br/>  
        </p>
        */