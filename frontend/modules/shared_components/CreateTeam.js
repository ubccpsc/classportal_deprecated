import React from 'react'
import { Form, FormRow, FormField, FormInput, FormIconField, FormSelect, Glyph, Button } from 'elemental'
import ContentModule from '../shared_components/ContentModule'
import Ajax from './Ajax'
import config from 'config'

export default React.createClass({
  getInitialState: function () {
    return { newTeam: [] };
  },
  handleSubmit: function (e) {
    e.preventDefault();
    var newTeam = this.state.newTeam;
    var alertMessage = "Forming team with students: ";

    //check for valid students
    for (var i = 0; i < config.team_size; i++) {
      //check that there actually is a selected student at this index 
      if (!!newTeam[i] && typeof newTeam[i] === 'string') {
        
        //check that this student was not previously selected
        for (var j = 0; j < i; j++){
          if (newTeam[i] === newTeam[j]) {
            alert("Error: Invalid team.");
            return;
          }
        }

        alertMessage += newTeam[i] + " ";
      }
      else {
        alert("Error: Invalid team.");
        return;
      }
      
    }

    alert(alertMessage);
    Ajax.createTeam(
      newTeam,
      function success (response) {
        console.log("CreateTeam.js| Success: " + response);
        alert("Success: Team " + response + " created!")
        //window.location.reload(true);
      }.bind(this),
      function error (xhr, status, err) {
        console.log("CreateTeam.js| Error: " + status + err);
        alert("Error: Could not create team.")
      }.bind(this)
    )
  },
  handleSelect: function (that, value) {
    if (!!value) {
      //this.state is immutable, so setState a new array 
      var temp = this.state.newTeam;
      temp[that] = value;
      this.setState({ newTeam: temp });
    }
    else {
      alert("Error: Bad selection");
    }
  },
  renderForm: function() {
    var oneOrMoreDropdowns = [];

    //build array of dropdown menus depending on specified team size
    for (var index = 0; index < config.team_size; index++){
      oneOrMoreDropdowns[index] = this.renderDropdown(index);
    }

    return (
      <Form onSubmit={this.handleSubmit}>
        <FormField id="text-center">
          {oneOrMoreDropdowns}
          <Button size="sm" submit>Form Team</Button>
        </FormField>  
      </Form>);
  },
  renderDropdown: function(index) {
    return (
      <FormSelect
        key={index.toString()}
        options={this.props.classlist}
        firstOption="Select"
        onChange={this.handleSelect.bind(this, index)}
        />);
  },
  render: function () {
    return (
      <ContentModule id="create-team" title="Create Team" initialHideContent={false}>
        {this.renderForm() }
      </ContentModule>
  )}
})

/*
 onChange={this.handleChange}

<FormSelect id="select1"
        options={!!this.props.studentName ? [] : this.props.classList}
        firstOption={!!this.props.studentName ? this.props.studentName : "Select"}
        onChange={ function doNothing() { } } />);

*/