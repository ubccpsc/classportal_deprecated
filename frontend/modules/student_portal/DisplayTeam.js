import React from 'react'
import Ajax from '../shared_components/Ajax'
import { Form, FormRow, FormField, FormInput, FormIconField, FormSelect, Glyph, Button } from 'elemental'

export default React.createClass({
  disbandTeam: function () {
    if (confirm("Please confirm that you want to disband the team.")) {
      Ajax.disbandTeam(
        this.props.myTeamFile.id,
        function success() {
          alert("Team has been disbanded!");
          window.location.reload(true);
        },
        function error() {
          alert("Error: team could not be disbanded.");
          window.location.reload(true);
        }
      );
    }
  },
  renderTeam: function () {
    return (
      <Form>
        {this.renderMembers() }
        <FormField>
          <Button size="sm" onClick={this.disbandTeam}>Disband</Button>
        </FormField>
      </Form>
    );
  },
  renderMembers: function () {
    var members = [];

    for (var index = 0; index < 2; index++) {
      members[index] = this.renderOneMember(index);
    }

    return members;
  },
  renderOneMember: function (index) {
    var teammateNames = this.props.teammateNames;
    var name = teammateNames[index];

    return (
      <FormIconField iconPosition="left" iconKey="mortar-board" key={index} >
        <FormInput
          placeholder={" " + name}
          name="supported-controls-input-sm" size="sm"
          name="supported-controls-input-disabled" disabled />
      </FormIconField>
    );
  },
  render: function () {
    return (
      <div className="module">
        <h3>Team { this.props.myTeamFile.id }</h3>
        {this.renderTeam() }
      </div>
    )
  }
})