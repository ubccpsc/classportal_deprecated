import React from 'react'
import {browserHistory } from 'react-router'
import {Row,Col,Form,FormField,Button,FormInput,Checkbox } from 'elemental'

const sidRegex = /^([0-9]){8}$/;
const csidRegex = /^[a-z][0-9][a-z][0-9]$/;

export default React.createClass({
  getInitialState: function() {
    return { github: '' };
  },

  handleSubmit: function (event) {
    event.preventDefault();
    var sid = event.target.elements[1].value; 
    var csid = event.target.elements[2].value;
    
    if (!!sid == false || sidRegex.test(sid) == false) {
      console.log("Register.js| invalid sid: " + sid)
      alert("Invalid entry. Please try again.");
      return;
    }
    
    if (!!sid == false || csidRegex.test(csid) == false) {
      console.log("Register.js| invalid csid: " + csid)
      alert("Invalid entry. Please try again.");
      return;
    }

    console.log("Register.js| valid login:"+ sid + ', ' + csid)
    
    $.ajax({
      url: 'http://localhost:4321/api/register',
      type: "POST",
      data: {
        "servertoken": localStorage.servertoken,
        "username": localStorage.username,
        "sid": sid,
        "csid": csid
      },
      dataType: 'json',
      cache: false,
      success: function(response) {
        //split response
        console.log("Register.js| Response: " + response);
        var fields = response.split('~');
        var redirect = fields[0];
        
        if (redirect == "success") {
          //TODO: need something here to "unlock" the student portal.
          console.log("Register.js| Successful registration. Redirecting to portal..");
          browserHistory.push("/");
        }
        else {
          console.log("Register.js| Invalid entry.");
          alert("Invalid entry. Please try again.");  
        }
        
      }.bind(this),
      error: function(xhr, status, err) {
        console.error("Register.js| Invalid info. ", status, err.toString());
        alert("Invalid entry. Please try again.");
      }.bind(this)
    });
  },
  
  componentDidMount: function () {
    if (!!localStorage.username) {
      this.setState({ github: localStorage.username });
    } else {
      this.setState({ github: "Error: not logged in" });
    }
  },
  
  render: function () {
    return (
      <div className="module">
        <h2>Register account</h2>
        <p>Please confirm your student info below.</p><br/>
        <Form onSubmit={this.handleSubmit} className="form" type="horizontal">
          <FormField label="Github Username">
            <FormInput placeholder={this.state.github} name="supported-controls-input-disabled" disabled />
          </FormField>
          <FormField label="UBC Student Number">
            <FormInput placeholder="eg. 12345678"/>
          </FormField>
          <FormField label="CS Undergrad Account">
            <FormInput placeholder="eg. a1b2"/>
          </FormField>
          <FormField offsetAbsentLabel>
            <Button submit>Submit</Button>
          </FormField>
        </Form>  
      </div>
    )}
})