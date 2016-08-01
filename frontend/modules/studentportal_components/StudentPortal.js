import React from 'react'
import Deliverables from './Deliverables'
import Grades from './Grades'
import Info from './Info'
import LogoutBar from './LogoutBar'
import Teams from './Teams'
import Update from './Update'
import NavLink from '../NavLink'
import { Row, Col, Button, Alert, Spinner } from 'elemental'

export default React.createClass({
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
  getUserInfo: function () {
    //TODO: VALIDATED REQUESTS ONLY (using servertoken)
    //TODO: DON'T RETURN ALL INFO on student. Make public and private keys in students.json
    
    console.log("using " + this.state.github + " to request other info:");
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
        console.error("getUserInfo", status, err.toString());
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
      <div>
        
        <div className="module">
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
      </div>
    )}
})

/*
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
*/