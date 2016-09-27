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
      var thisTeamId = this.props.teams[index].id;
      //if viewAll is true, render all students; otherwise, only render students from myTeams.
      if (that.state.viewAll ? true : this.include(this.props.admins[this.props.myAdminIndex].teams, thisTeamId.toString())) {
        teams.push(that.renderOneTeam(thisTeamId));
      }
    }
    return teams;
  },
  renderOneTeam: function (teamId) {
    var allTeams = this.props.teams;
    var thisTeam;
    for (var i = 0; i < allTeams.length; i++) {
      if (allTeams[i].id == teamId) {
        thisTeam = allTeams[i];
      }
    }
    return (
      <tr key={thisTeam.id}>
        <td className="tg-yw4l">{thisTeam.id}</td>
        <td className="tg-yw4l">
          {!!thisTeam.url ?
            <a href={thisTeam.url} target="blank" >View</a>
            : "Not set" }</td>
        <td className="tg-edam">
          {this.renderTeamMembers(thisTeam.members) }
        </td>
        <td className="tg-yw4l">
          {this.renderTAs(thisTeam.id) }
        </td>
        <td className="tg-yw4l">
          <Button id={thisTeam.id} size="sm" className="button-text" onClick={this.editGrades} type="link-text">Open</Button>
        </td>
        <td className="tg-yw4l">
          {this.props.admins[this.props.myAdminIndex].prof === true ?
            <Button id={thisTeam.id} size="sm" className="button-text" onClick={this.disbandTeam} type="link-text">Disband</Button>
            : <Button id={thisTeam.id} size="sm" className="button-text" onClick={this.addSelfToTeam} type="link-text">Add TA</Button>
          }
        </td>
      </tr>
    );
  },
  renderTAs: function (teamId) {
    var admins = this.props.admins;
    var TAs = []
    for (var i = 0; i < admins.length; i++) {
      if (this.include(admins[i].teams, teamId.toString())) {
        TAs[i] = admins[i].firstname + " ";
      }
    }
    return TAs.length > 0 ? TAs : "None"
  },
  renderTeamMembers: function (members) {
    var links = [];

    for (var i = 0; i < members.length; i++) {
      var studentFile = this.returnStudent(members[i]);
      var studentName = studentFile.firstname + " " + studentFile.lastname;
      if (!!studentFile.username) {
        links[i] = (
          <a key={i}
            href={"http://github.com/" + studentFile.username}
            target="_blank">
            { i !== members.length - 1 ? studentName + ", " : studentName}
          </a>);
      }
      else {
        links[i] = (<p key={i}>{studentName}</p>);
      }
    }
    return links;
  },
  returnStudent: function (studentNum) {
    var students = this.props.students;
    //search students file for matching sid
    for (var index = 0; index < students.length; index++) {
      if (students[index].sid === studentNum) {
        return students[index];
      }
    }
    return "null";
  },
  editGrades: function (event) {
    event.preventDefault();
    alert("Team grading not yet implemented.");
  },
  addSelfToTeam: function (event) {
    event.preventDefault();
    if (confirm("Would you like to assign yourself to team " + event.target.id + "?")) {
      Ajax.assignTeam(
        localStorage.username,
        event.target.id,
        function onSuccess() {
          alert("Success!");
          window.location.reload(true);
        },
        function onError() {
          alert("Error: admin was not added.");
        }
      )
    }
  },
  disbandTeam: function (event) {
    if (confirm("Please confirm that you want to disband team " + event.target.id + ".")) {
      Ajax.disbandTeam(
        event.target.id,
        function onSuccess() {
          alert("Team has been disbanded!");
          window.location.reload(true);
        },
        function onError() {
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
              <th className="tg-yw4l">Repo</th>
              <th className="tg-yw4l">Members</th>
              <th className="tg-yw4l">TAs</th>
              <th className="tg-yw4l">Grades</th>
              <th className="tg-yw4l">Edit</th>
            </tr>
            {this.renderTeams() }
          </tbody>
        </table>
      </ContentModule>
    )
  }
})