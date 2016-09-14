import React from 'react'
import config from 'config';
import Ajax from '../shared_components/Ajax'
import ContentModule from '../shared_components/ContentModule'
import { Form, FormRow, FormField, FormInput, FormIconField, FormSelect, Glyph, Button, InputGroup } from 'elemental'

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
      <div>
        <InputGroup >
          {this.renderMembers() }
          {config.students_can_disband_teams &&
            (<InputGroup.Section>
              <Button size="sm" onClick={this.disbandTeam}><Glyph icon="tools"/>&nbsp; Disband</Button>
            </InputGroup.Section>) }
        </InputGroup>
      </div>
    );
  },
  renderMembers: function () {
    var members = [];
    var memberName;

    for (var index = 0; index < config.team_size; index++) {
      memberName = this.props.teammateNames[index];
      members[index] =
        (<InputGroup.Section key={index} grow>
          <FormIconField iconPosition="left" iconKey="mortar-board">
            <FormInput placeholder={" " + memberName} size="sm" disabled/>
          </FormIconField>
        </InputGroup.Section>);
    }
    return members;
  },
  render: function () {
    return (
      <ContentModule id="display-team-module" title={"Team " + this.props.myTeamFile.id }  initialHideContent={false}>
        {this.renderTeam() }
      </ContentModule>
    )
  }
})