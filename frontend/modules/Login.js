// modules/Login.js
import React from 'react'
import { Col, Row, Button, Alert, Spinner } from 'elemental'

var GithubComponent = React.createClass({
  render: function () {
    return (
      <div>
        <p>
          <a href="https://github.com/login/oauth/authorize?client_id=97ae59518a9d5cae2550&redirect_uri=http://localhost:4321/postlogin">
            Authenticate with GitHub
          </a>
        </p>
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
  handleLoginSubmit: function (currentStudent) {
    
    //get new list
    //PROBLEM: this function takes longer to execute than the code below: thus, it takes
    //the second time running the login button to do the stuff below properly.
    this.loadStudentsFromServer();

    //TODO (what should happen):
    //ACTUALLY send User/Pass to server to verify; after server verifies, it will send all the student data back.
    
    //do stuff
    var allStudents = this.state.data;
    console.log("currentStudent: ");
    console.log(currentStudent);
    console.log("allStudents :");
    console.log(allStudents);

    //search allStudents for stdnum matching currentStudent (who is trying to log in)
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
    alert("Login failed!");
  },
  getInitialState: function() {
    return {data: []};
  },
  componentDidMount: function() {
    console.log(JSON.stringify(localStorage));
    
    //this.loadStudentsFromServer();
    //this continuously polls all the students. Disabled, because we simply want
    //to poll ONE student, the CURRENT user, ONLY at the moment they log in!
    //setInterval(this.loadStudentsFromServer, this.props.pollInterval);
  },
  render: function () {
    return (
      <div className="module">
        <Row>
          <Col sm="1">
            <GithubComponent data={this.state.data} url = {this.props.url}/>
          </Col>  
        </Row>
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