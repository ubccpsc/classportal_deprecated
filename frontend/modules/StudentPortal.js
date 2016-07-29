import React from 'react'

var InfoComponent = React.createClass({
  render: function() {
    return (
      <div className="infoComponent">
        {this.props.data.firstname} {this.props.data.lastname}<br/><br/>
        student #: {this.props.data.sid} <br/>
        cpsc id: {this.props.data.csid}<br/>
        github: {this.props.data.github}<br/>
      </div>
    );
  }
});

var TeamComponent = React.createClass({
   render: function() {
    return (
      <div className="teamComponent">
        team #: {this.props.data.team} <br/>
        team members: {this.props.data.members} <br/>
      </div>
    );
  }
});

var DeliverablesComponent = React.createClass({
  render: function() {
    return (
      <div>
        <h4>Assignment 1</h4>
        open date: {this.props.data.open}<br/>
        due date: {this.props.data.due}<br/>
        criteria: <a href="http://google.com">view</a><br/>
        view submission: <a href="http://google.com"> view</a><br />
        submit: <input type="submit" value="submit" /><br/><br/>
        
        <h4>Assignment 2</h4>
        open date: {this.props.data.open}<br/>
        due date: {this.props.data.due}<br/>
        criteria: <a href="http://google.com">view</a><br/>
        view submission: <a href="http://google.com"> view</a><br />
        submit: <input type="submit" value="submit" /><br/><br/>
        
        <h4>Assignment 3</h4>
        open date: {this.props.data.open}<br/>
        due date: {this.props.data.due}<br/>
        criteria: <a href="http://google.com">view</a><br/>
        view submission: <a href="http://google.com"> view</a><br />
        submit: <input type="submit" value="submit" /><br/><br/>
        
      </div>
    );
  }
});

var GradesComponent = React.createClass({
  render: function () {
    return (
      <div className="studentData">
        Assn1: {this.props.data.assn1}<br/>
        Assn2: {this.props.data.assn2}<br/>
        Assn3: {this.props.data.assn3}<br/>
        Midterm: {this.props.data.midterm}<br/>
        Final Exam: {this.props.data.final}<br/>
      </div>
    );
  }
});

var Page = React.createClass({
  
  loadNewStudent: function (num) {
    $.ajax({
      url: this.props.url + '/api/students/' + num,
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
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

  getInitialState: function() {
    return {
      sid:'',
      csid:'',
      firstname:'',
      lastname:'',
      email:'',
      github: ''
    };
  },
  componentDidMount: function () {
    this.setState({ github: localStorage.username });
    this.getUserInfo();
  },
  render: function () {
    return (
      <div className="page">
        <h1>STUDENT PORTAL</h1>
        
        <h3>Info</h3>
        {this.state.firstname} {this.state.lastname}<br/><br/>
        student #: {this.state.sid} <br/>
        cpsc id: {this.state.csid}<br/>
        github: {this.state.github}<br/>
        email: {this.state.email}<br/>
        
        {/*
        <h3>Team</h3>
        <TeamComponent data={this.state.data}/><br/>

        <h3>Deliverables</h3>
        <DeliverablesComponent data={this.state.data}/><br/>
        
        <h3>Grades</h3>
        <GradesComponent data={this.state.data}/>
        */}

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