import React from 'react'
import { Form, FormRow, FormField, FormInput, FormIconField, FormSelect, Glyph, Button } from 'elemental'
import ContentModule from '../../shared_components/ContentModule'

export default React.createClass({
  getInitialState: function () {
    return { viewAll: false };
  },
  toggleView: function (e) {
    e.preventDefault();
    this.setState({ "viewAll": !this.state.viewAll }, function () {
      console.log("AdminTeams.js| viewAll: " + this.state.viewAll);
    });
  },
  renderTeams: function () {
    var teams = [];
    if (this.state.viewAll) {
      for (var index = 1; index < 6; index++) {
        teams[index] = this.renderTeam(index);
      }
    }
    else {
      for (var index = 1; index < 6; index++) {
        if (index % 2){
          teams[index] = this.renderTeam(index);
        }
      }
    }
    return teams;
  },
  renderTeam: function (index) {
    return (
      <div className="tg-wrap-deliverables" key={index}>
        <table className="tg">
          <tbody>
            <tr>
              <th className="tg-7wrc" colSpan="2">Team {index}</th>
            </tr>
            <tr>
              <td className="tg-edam">Repo</td>
              <td className="tg-value"><a href="http://github.com/user/project" target="blank">http://github.com/user/project</a></td>
            </tr>
            <tr>
              <td className="tg-edam">Members</td>
              <td className="tg-value">
                <a href="student1" target="blank">student1</a>,&nbsp;
                <a href="student2" target="blank">student2</a>
              </td>
            </tr>
            <tr>
              <td className="tg-edam">Marks</td>
              <td className="tg-value">
                <a href="student2" target="blank">View / Submit </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  },
  render: function () {
    return (
       <ContentModule id="create-projects-module" title={this.state.viewAll ? "All Teams" : "My Teams"} initialHideContent={false}>
          <Form id="text-center" onSubmit={this.toggleView} >
            <FormField>
              <Button type={this.state.viewAll ? "hollow-primary" : "primary"} submit size="sm">Toggle</Button>&nbsp;
            </FormField>
          </Form>
          {this.renderTeams() }
      </ContentModule>
    )}        
})
        
  