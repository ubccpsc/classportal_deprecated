import React from 'react'
import ContentModule from '../../shared_components/ContentModule'
import Ajax from '../../shared_components/Ajax'
import { Form, FormRow, FormField, FormInput, FormIconField, FormSelect, Glyph, Button } from 'elemental'

export default React.createClass({
  getInitialState: function () {
    return { viewAll: true };
  },
  toggleView: function (e) {
    e.preventDefault();
    this.setState({ "viewAll": !this.state.viewAll }, function () {
      // console.log("AdminTeams.js| viewAll: " + this.state.viewAll);
    });
  },
  include: function (arr, obj) {
    var result = (arr.indexOf(obj) != -1);
    // console.log("AdminStudents.js| Checking if " + obj + " exists in " + JSON.stringify(arr) + ". Result: " + result.toString());
    return (result);
  },
  renderTeams: function () {
    var that = this;
    var teams = [];
    for (var index = 0; index < this.props.teams.length; index++) {
      //if viewAll is true, render all students; otherwise, only render students from myTeams.
      if (that.state.viewAll ? true : this.include(this.props.myTeams, index.toString())) {
        teams.push(that.renderOneTeam(index));
      }
    }
    return teams;
  },
  renderOneTeam: function (index) {
    var team = this.props.teams[index];
    var students = this.props.students;

    function returnName(studentNum) {
      //search students file for matching sid
      for (var index = 0; index < students.length; index++) {
        if (students[index].sid === studentNum) {
          return students[index].firstname + " " + students[index].lastname;
        }
      }
      return "null";
    }

    return (
      <tr key={index}>
        <td className="tg-yw4l">{team.id}</td>
        <td className="tg-yw4l">
          {!!team.url ?
            <a href={team.url} target="blank" >
              View
            </a>
            : "Not set" }</td>
        <td className="tg-edam">
          {returnName(team.members[0]) + ", " + returnName(team.members[1]) }
        </td>
        <td className="tg-yw4l">-</td>
        <td className="tg-yw4l">
          <Button size="sm" className="button-text" type="link-text">View/Edit</Button>
        </td>
        <td className="tg-yw4l">
          <Button id={team.id} size="sm" className="button-text" type="link-text" onClick={this.disbandTeam} >Disband</Button>
        </td>

      </tr>
    );
  },
  disbandTeam: function (event) {
    if (confirm("Please confirm that you want to disband team " + event.target.id + ".")) {
      Ajax.disbandTeam(
        event.target.id,
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
  render: function () {
    return (
      <ContentModule id="admin-teams-module" title={this.state.viewAll ? "All Teams" : "My Teams"} initialHideContent={false}>
        <Form id="text-center" onSubmit={this.toggleView} >
          <FormField>
            <Button type={this.state.viewAll ? "hollow-primary" : "primary"} submit size="sm">Toggle</Button>&nbsp;
          </FormField>
        </Form>

        <table className="tg">
          <tbody>
            <tr>
              <th className="tg-yw4l">Team ID</th>
              <th className="tg-yw4l">GitHub</th>
              <th className="tg-yw4l">Members</th>
              <th className="tg-yw4l">TA</th>
              <th className="tg-yw4l">Grades</th>
              <th className="tg-yw4l">Disband</th>
            </tr>
            {!!this.props.teams && this.renderTeams() }
          </tbody>
        </table>
      </ContentModule>
    )
  }
})