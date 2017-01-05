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
    var appName = this.state.appName;
    var appDescription = this.state.appDescription;
    var alertMessage = "Forming team with students: ";

    //check for valid students
    var count = 0;
    for (var i = 0; i < config.team_size; i++) {
      //check that there actually is a selected student at this index 
      if (!!newTeamArray[i] && typeof newTeamArray[i] === 'string') {

        //check that this student was not previously selected
        for (var j = 0; j < i; j++) {
          if (newTeamArray[i] === newTeamArray[j]) {
            alert("Error: Invalid team. Non unique team members: "+newTeamArray[i]);
            return;
          }
        }
        alertMessage += newTeamArray[i] + " ";
        count++;
      }
      else if (count < config.min_team_size) {
        alert("Error: Invalid team. Leave empty selections at the end.");
        return;
      } 
    }

    if (config.enable_app_store){
      if (typeof appName === "undefined" || typeof appDescription === "undefined") {
          alert("Error: Invalid app name, description");
          return;
        }
    }

    if (confirm(alertMessage)) {
      Ajax.createTeam(
        newTeamArray,
        appName,
        appDescription,
        function onSuccess(response) {
          // console.log("CreateTeam.js| Success: " + response);
          alert("Success: Team " + response + " created!")
          window.location.reload(true);
        }.bind(this),
        function onError(xhr, status, err) {
          alert("Error: Could not create team.")
        }.bind(this)
      )
    }
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
  setAppName: function (event) {
    this.setState({ appName: event.target.value });
  },
  setAppDescription: function (event) {
    this.setState({ appDescription: event.target.value });
  },  
  renderAppFields: function () {
    return (
      <div id="app-team-fields">
        <FormField>
          <FormInput placeholder="App name" onChange={this.setAppName }/>
        </FormField>
        <FormField>
          <FormInput multiline placeholder="App description"  onChange={this.setAppDescription}/>
        </FormField>
      </div>
    )
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
        {config.enable_app_store ? this.renderAppFields() : <br />}
        <FormField id="drop-downs">
          {oneOrMoreDropdowns}
        </FormField>
        <FormField id="team-info">
          <p>Minimun number of students per team: <strong>{config.min_team_size}</strong></p>
        </FormField>
        <FormField id="text-center">
          <Button size="sm" submit>Form Team</Button>
        </FormField>
      </Form>);
  },
  renderDropdown: function (index) {
    return (
      <FormSelect
        key={index.toString() }
        options={this.props.namesArray}
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
        {!!this.props.namesArray ? this.renderForm() : (<div><h4>Error: No classlist provided.</h4><br/></div>) }
      </ContentModule>
    )
  }
})