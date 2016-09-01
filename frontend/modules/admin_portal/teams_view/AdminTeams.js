import React from 'react'
import { Form, FormRow, FormField, FormInput, FormIconField, FormSelect, Glyph, Button } from 'elemental'
import ContentModule from '../../shared_components/ContentModule'

export default React.createClass({
  getInitialState: function () {
    return { viewAll: true };
  },
  toggleView: function (e) {
    e.preventDefault();
    this.setState({ "viewAll": !this.state.viewAll }, function () {
      console.log("AdminTeams.js| viewAll: " + this.state.viewAll);
    });
  },
  include: function(arr, obj) {
      var result = (arr.indexOf(obj) != -1);
      console.log("AdminStudents.js| Checking if " + obj + " exists in " + JSON.stringify(arr) + ". Result: " + result.toString());
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
          <a href="" target="blank">{team.members[0]}</a>,&nbsp;
          <a href="" target="blank">{team.members[1]}</a>
        </td>
        <td className="tg-yw4l">
          <a href="" target="blank">View / Submit</a>
        </td>
      </tr>
    );
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
              <th className="tg-yw4l">Marks</th>
            </tr>
            {!!this.props.teams && this.renderTeams() }
          </tbody>
        </table>
      </ContentModule>
  )}
})