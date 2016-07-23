import React from 'react'

var InfoComponent = React.createClass({
  render: function() {
    return (
      <div className="infoComponent">
        student #: {this.props.data.stdnum} <br/>
        cs id: {this.props.data.csid}<br/>
        full name: {this.props.data.fullname}<br/>
        github: {this.props.githubUser}<br/>
        courses: {this.props.data.courses}<br/>
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
  loadStudentsFromServer: function () {
    //not ideal, but for now, the client gets ALL ids and checks if 
    //student logging in is on the list.
    console.log("getting all student ids");
    $.ajax({
      url: this.props.url + '/api/students',
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
  loadNewStudent: function(num) {
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
  handleSubmit: function () {
    console.log("accessing api to start github get...");

    $.ajax({
      url: this.props.url + '/api/github',
      dataType: 'text',
      cache: false,
      success: function(response) {
        console.log("Success!!");
        console.log(response);
        this.setState({ githubUser: response });
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url);
        console.error(status);
        console.error(err.toString());
      }.bind(this)
    });
  },  
  handleLoginSubmit: function (currentStudent) {
    //get new list
    //PROBLEM: this function takes longer to execute than the code below: thus, it takes
    //the second time running the login button to do the stuff below properly.
    //this.loadStudentsFromServer();

    //TODO (what should happen):
    //ACTUALLY send User/Pass to server to verify; after server verifies, it will send all the student data back.
    
    //do stuff
    //var allStudents = this.state.data;
    //console.log("currentStudent: ");
    //console.log(currentStudent);
    //console.log("allStudents :");
    //console.log(allStudents);

    //search allStudents for stdnum matching currentStudent (who is trying to log in)
    /*
    for (let i = 0; i < allStudents.length; i++) {
      console.log("i: ");
      console.log(i);
      if (allStudents[i].stdnum == currentStudent.stdnum) {
        console.log("login is valid!");
        //valid stdnum, therefore load student's info
        this.loadNewStudent(i);
        return;
      }
    }
    console.log("login is invalid!");
    alert("Login failed!");*/

  },
  getInitialState: function() {
    return { githubUser: 'not logged in', data: []};
  },
  componentDidMount: function () {
    this.handleSubmit();
  },
  render: function () {
    return (
      <div className="page">
        <h1>Class Portal after Github redirect</h1>
        
        <h3>Info</h3>
        <InfoComponent githubUser={this.state.githubUser} data={this.state.data}/><br/>
        
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