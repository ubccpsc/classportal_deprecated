import React from 'react'
import {browserHistory } from 'react-router'
import {Row,Col,Form,FormField,Button,FormInput,Checkbox } from 'elemental'

export default React.createClass({
  getInitialState: function () {
    return {
      sid: '',
      csid: '',
      firstname: '',
      lastname: '',
      email: '',
      github: '',
    };
  },

  getUserInfo: function () {
    $.ajax({
      url: 'http://localhost:4321/api/getUserInfo/'+this.state.github,
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

  handleSubmit: function (event) {
    event.preventDefault();
    var asdf = this.state;
    if (!!event.target.elements[0].value)
      asdf.firstname = event.target.elements[0].value;
    if (!!event.target.elements[1].value)
      asdf.lastname = event.target.elements[1].value;
    if (!!event.target.elements[2].value)
      asdf.sid = event.target.elements[2].value;
    if (!!event.target.elements[3].value)
      asdf.csid = event.target.elements[3].value;
    if (!!event.target.elements[4].value)
      asdf.email = event.target.elements[4].value;
    
    $.ajax({
      url: this.props.url + '/api/updateUserInfo/'+this.state.github,
      type: "POST",
      data: asdf,
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
        <Form onSubmit={this.handleSubmit} className="form" type="horizontal">
          <FormField label="First name">
            <FormInput placeholder={this.state.firstname} />
          </FormField>
          <FormField label="Last name">
            <FormInput placeholder={this.state.lastname}/>
          </FormField>
          <FormField label="Student number">
            <FormInput placeholder={this.state.sid}/>
          </FormField>
          <FormField label="Computer Science ID">
            <FormInput placeholder={this.state.csid}/>
          </FormField>
          <FormField label="Email address">
            <FormInput placeholder={this.state.email}/>
          </FormField>
          <FormField offsetAbsentLabel>
            <Button submit>Update</Button>
          </FormField>
        </Form>  
      </div>
    )}
})