import React from 'react'
import { Form, FormRow, FormField, FormInput, FormIconField, FormSelect, Glyph, Button } from 'elemental'

export default React.createClass({
  teamSubmit: function (event) {
    event.preventDefault;
    if (1) {
      alert("Submitting team..")
    }
    else {
      alert("Error: Invalid team.")
    }
  },
  handleSelect: function () {
    //alert("Choosing team..")
  },
  formTeam: function () {
    var asdf = "circle-slash";
    var valid = false;
    var options1 = [{ "label": "1" }, { "label": "2" }];
    var options2 = [{ "label": "1" }, { "label": "2" }];
    var set1 = false;
    var set2 = false;

    return (
      <Form onSubmit={this.teamSubmit}>
        <FormField>
          <FormSelect options={options1} firstOption="Select" onChange={this.handleSelect} />
        </FormField>
        
        <FormField>
          <FormSelect options={options2} firstOption="Select" onChange={this.handleSelect} />
        </FormField>

        <FormField>
          <Button size="sm" type="default-danger" submit><Glyph icon={asdf} />&nbsp; Form Team</Button>
        </FormField>
      </Form>
    );
  },
  renderMembers: function () {
    return (
      <FormRow type="inline" >
        <FormIconField id="short-forms" width="one-third" iconPosition="left" iconKey="mortar-board" >
          <FormInput placeholder={" " + this.props.team1} name="supported-controls-input-sm" size="sm" name="supported-controls-input-disabled" disabled />
        </FormIconField>
        <FormIconField id="short-forms" width="one-third" iconPosition="left" iconKey="mortar-board" >
          <FormInput placeholder={" " + this.props.team2} name="supported-controls-input-sm" size="sm" name="supported-controls-input-disabled" disabled />
        </FormIconField>
        <FormIconField id="short-forms" width="one-third" iconPosition="left" iconKey="mortar-board" >
          <FormInput placeholder={" " + this.props.team3} name="supported-controls-input-sm" size="sm" name="supported-controls-input-disabled" disabled />
        </FormIconField>
      </FormRow>
    );
  },
  render: function () {
    return (
      <div className="module">
        <h3>{!this.props.isTeamTrue && ("Create ")}Team {this.props.isTeamTrue && this.props.teamNumber}</h3><br/>
        {!this.props.isTeamTrue && this.formTeam()}
        {this.props.isTeamTrue && this.renderMembers()}
      </div>
    )}
})