import React from 'react'
import { Form, FormRow, FormField, FormInput, FormIconField, FormSelect, Glyph, Button } from 'elemental'

export default React.createClass({
  renderTeam: function () {
    return (
      <Form>
        {this.renderMembers() }
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
    var members = this.props.myTeamFile.members;
    var sid = members[index];

    return (
      <FormIconField iconPosition="left" iconKey="mortar-board" key={index} >
        <FormInput
          placeholder={" " + sid}
          name="supported-controls-input-sm" size="sm"
          name="supported-controls-input-disabled" disabled />
      </FormIconField>
    );
  },
  render: function () {
    return (
      <div className="module">
        <h3>Team { this.props.myTeamFile.id }</h3>
        {!!this.props.myTeamFile && this.renderTeam() }
      </div>
    )
  }
})