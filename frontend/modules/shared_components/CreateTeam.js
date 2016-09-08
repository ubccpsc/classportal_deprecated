import React from 'react'
import { Form, FormRow, FormField, FormInput, FormIconField, FormSelect, Glyph, Button } from 'elemental'
import ContentModule from '../shared_components/ContentModule'
import Ajax from './Ajax'
import config from 'config'

export default React.createClass({
  getInitialState: function () {
    return { newTeamArray: [] };
  },
  handleSubmit: function (e) {
    e.preventDefault();
    var newTeamArray = this.state.newTeamArray;
    var alertMessage = "Forming team with students: ";

    //check for valid students
    for (var i = 0; i < config.team_size; i++) {
      //check that there actually is a selected student at this index 
      if (!!newTeamArray[i] && typeof newTeamArray[i] === 'string') {

        //check that this student was not previously selected
        for (var j = 0; j < i; j++) {
          if (newTeamArray[i] === newTeamArray[j]) {
            alert("Error: Invalid team.");
            return;
          }
        }
        alertMessage += newTeamArray[i] + " ";
      }
      else {
        alert("Error: Invalid team.");
        return;
      }
    }

    alert(alertMessage);
    Ajax.createTeam(
      newTeamArray,
      function success(response) {
        console.log("CreateTeam.js| Success: " + response);
        alert("Success: Team " + response + " created!")
        window.location.reload(true);
      }.bind(this),
      function error(xhr, status, err) {
        console.log("CreateTeam.js| Error: " + status + err);
        alert("Error: Could not create team.")
      }.bind(this)
    )
  },
  handleSelect: function (index, value) {
    if (!!value) {
      // this.state is immutable, so setState a new array 
      var temp = this.state.newTeamArray;
      temp[index] = value;
      this.setState({ newTeamArray: temp });
    }
    else {
      alert("Error: Bad selection");
    }
  },
  renderForm: function () {
    var oneOrMoreDropdowns = [];

    //build array of dropdown menus depending on specified team size
    for (var index = 0; index < config.team_size; index++) {
      if (index == 0 && this.props.isAdmin !== "true") {
        oneOrMoreDropdowns[index] = this.renderFirstDropdown();
      }
      else {
        oneOrMoreDropdowns[index] = this.renderDropdown(index);
      }
    }

    return (
      <Form onSubmit={this.handleSubmit}>
        <FormField id="text-center">
          {oneOrMoreDropdowns}
          <Button size="sm" submit>Form Team</Button>
        </FormField>
      </Form>);
  },
  renderDropdown: function (index) {
    var original_classlist = this.props.classlist;
    
    // remove the students who already are in a team
    // var editted_classlist;

    return (
      <FormSelect
        key={index.toString() }
        options={original_classlist}
        firstOption="Select"
        onChange={this.handleSelect.bind(this, index) }
        />);
  },
  renderFirstDropdown: function () {
    return (
      <FormSelect
        key="first"
        options={[{ "label": this.props.studentName }]}
        firstOption="Select"
        onChange={this.handleSelect.bind(this, 0) }
        />);
  },
  render: function () {
    return (
      <ContentModule id="create-team" title="Create Team" initialHideContent={false}>
        {!!this.props.classlist ? this.renderForm() : (<div><h4>Error: No classlist provided.</h4><br/></div>) }
      </ContentModule>
    )
  }
})