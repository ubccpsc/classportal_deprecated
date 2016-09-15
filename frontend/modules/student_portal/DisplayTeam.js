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
          {this.renderRepoButton() }
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
  renderRepoButton: function () {
    var button;

    if (!this.props.myTeamFile.url) {
      function alertOnClick() {
        alert("Team repository has not yet been set by the prof.");
      }
      button = (
        <InputGroup.Section>
          <Button size="sm" onClick={alertOnClick }>
            <Glyph icon="organization"/>&nbsp; Repo
          </Button>
        </InputGroup.Section >)
    }
    else {
      button = (
        <InputGroup.Section>
          <a href={this.props.myTeamFile.url} target="blank" >
            <Button size="sm" ><Glyph icon="organization"/>
              &nbsp; Repo
            </Button>
          </a>
        </InputGroup.Section>)
    }

    return button;
  },
  render: function () {
    return (
      <ContentModule id="display-team-module" title={"Team " + this.props.myTeamFile.id }  initialHideContent={false}>
        {this.renderTeam() }
      </ContentModule>
    )
  }
})