import React from 'react'
import { Form, FormRow, FormField, FormInput, FormIconField, FormSelect, Glyph, Button } from 'elemental'
import ContentModule from '../shared_components/ContentModule'

export default React.createClass({
  getInitialState: function () {
    return {
      student1: "",
      student2: ""
    };
  },
  handleSubmit: function (e) {
    e.preventDefault;
    /*
    if (!!this.state.student1 & !!this.state.student2) {
      //alert("Send invite to: " + this.state.student1 + " and " + this.state.student2 + "?");
      $.ajax({
        url: 'http://localhost:4321/api/formTeam',
        type: "POST",
        headers: {
          "user": localStorage.user,
          "token": localStorage.token,
          "admin": localStorage.admin
        },
        data: {
          "student1": this.state.student1,
          "student2": this.state.student2
        },
        dataType: 'json',
        cache: false,
        success: function (response) {
          console.log("CreateTeam.js| Success: " + response);
          //alert("Submitted team!")
        }.bind(this),
        error: function (xhr, status, err) {
          console.log("CreateTeam.js| Error: " + status + err);
          //alert("Error: Could not reach server.")
        }.bind(this)
      });
    }
    else {
      //alert("Error: Invalid team.")
    }
    */
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
            <FormSelect id="select1" options={this.props.classList} firstOption="Select" onChange={ function doNothing(){} } />
            <Button size="sm" submit>Form Team</Button>
          </FormField>
        </Form>
      </ContentModule>
    )}
})