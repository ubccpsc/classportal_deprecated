import React from 'react'

var Page = React.createClass({
  getInitialState: function () {
    return {
      sid:'',
      csid:'',
      firstname:'',
      lastname:'',
      email:'',
      github:''
    };
  },
  getUser: function () {
    $.ajax({
      url: this.props.url + '/api/githubuserinfo',
      method: "GET",
      dataType: 'json',
      cache: false,
      success: function(data) {
        console.log("getUser success! Github user:  " + data);
        this.setState({ github: data });
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  handleUpdate: function (event) {
    event.preventDefault()
    this.setState({ firstname: event.target.elements[0].value });
    this.setState({ lastname: event.target.elements[1].value });
    this.setState({ sid: event.target.elements[2].value });
    this.setState({ csid: event.target.elements[3].value });
    this.setState({ email: event.target.elements[4].value });
  },
  //tell server to create student,update student info, don't show this page again
  handleSubmit: function (event) {
    event.preventDefault();
    
    var dataObj = {
      "sid": this.state.sid,
      "csid": this.state.csid,
      "firstname": this.state.firstname,
      "lastname": this.state.lastname,
      "email": this.state.email
    }

    $.ajax({
      url: this.props.url + '/api/newStudent',
      type: "POST",
      data: dataObj,
      dataType: 'json',
      cache: false,
      success: function(data) {
        console.log("create/update newStudent success!");
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  componentDidMount: function () {
    this.getUser();
  },
  render: function () {
    return (
      <div className="page">
        <p>First time login for github user:</p>
        <h4>{this.state.github}</h4>
        <p>Update info below to associate it with your Github account.</p>
        
        <form onSubmit={this.handleUpdate}>
          <input type="text" placeholder="first name"/><br/>
          <input type="text" placeholder="last name"/><br/>
          <input type="text" placeholder="student number"/><br/>
          <input type="text" placeholder="csid"/><br/>
          <input type="text" placeholder="preferred email"/><br/>
          <button type="submit">Update</button><br/><br/>
        </form>
        
        <p id="userInfo">
          first name: {this.state.firstname}<br/>
          last name: {this.state.lastname}<br/>
          student #: {this.state.sid} <br/>
          cs id: {this.state.csid}<br/>
          email: {this.state.email}<br/>  
        </p>
        
        <form onSubmit={this.handleSubmit}>
          <button type="submit">SUBMIT</button>
        </form>

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