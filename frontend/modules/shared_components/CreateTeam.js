import React from 'react'
import { Form, FormRow, FormField, FormInput, FormIconField, FormSelect, Glyph, Button } from 'elemental'
import ContentModule from '../shared_components/ContentModule'
import Ajax from './Ajax'

export default React.createClass({
  getInitialState: function () {
    return {
      student1: "",
      student2: ""
    };
  },
  handleSubmit: function (e) {
    e.preventDefault();
    var std1 = this.state.student1;
    var std2 = this.state.student2;

    if (!!std1 && !!std2 && (std1 != std2)) {
      alert("Send invite to: " + std1 + " and " + std2 + "?");
      Ajax.createTeam(
        {
          "students": [ std1, std2 ]
        },
        function success (response) {
          console.log("CreateTeam.js| Success: " + response);
          alert("Success: Team " + response + " created!")
          window.location.reload(true);
        }.bind(this),
        function error (xhr, status, err) {
          console.log("CreateTeam.js| Error: " + status + err);
          alert("Error: Could not create team.")
        }.bind(this)
      )
    }
    else {
      alert("Error: Invalid team.")
    }
  },
  handleSelect: function (e) {
    if (e.target.id === "select1") {
      this.setState({ student1: e.target.value });
    }
    else if (e.target.id === "select2") {
      this.setState({ student2: e.target.value });
    }
    else {
      alert("Error: Bad selection");
    }
  },
  //TODO: variable team size based on config file.
  render: function () {
    return (
      <ContentModule id="createTeamModule" title="Create Team" initialHideContent={false}>
        <Form onSubmit={this.handleSubmit}>
          <FormField id="text-center" onChange={this.handleSelect}>
            <FormSelect id="select1"
                        options={!!this.props.studentName ? [] : this.props.classList}
                        firstOption={!!this.props.studentName ? this.props.studentName : "Select"}
                        onChange={ function doNothing(){} } />
            <FormSelect id="select2"
                        options={this.props.classList}
                        firstOption="Select"
                        onChange={ function doNothing(){} } />
            <Button size="sm" submit>Form Team</Button>
          </FormField>
        </Form>
      </ContentModule>
    )}
})