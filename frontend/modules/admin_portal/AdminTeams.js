import React from 'react'
import { Form, FormRow, FormField, FormInput, FormIconField, FormSelect, Glyph, Button } from 'elemental'

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
        </table><br/>
      </div>
    );
  },
  render: function () {
    return (
      <div>
        <div className="module">
          <h3>{this.state.viewAll ? "All" : "My"} Teams</h3><br/>
          <Form id="text-center" onSubmit={this.toggleView} >
            <FormField>    
              <Button type={this.state.viewAll ? "hollow-primary" : "primary"} submit size="sm">Toggle View</Button>&nbsp;
            </FormField>
          </Form>
          {this.renderTeams() }
        </div>
        <FormTeam/>
      </div>
    )}
})

const FormTeam = React.createClass({
  handleSelect: function () {
    
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
  render() {
    return (
      <div className="module">
        <h3>Form Team</h3><br/>
        {this.formTeam()}
      </div>
    )}
})


/*

            <tr>
              <td className="tg-edam">Assignment 1 (Group)</td>
              <td className="tg-value">
                <Form onSubmit={this.gradeSubmit}>
                  <FormField label="Type">
                    <FormSelect options={options1} onChange={this.updateSelect} />
                  </FormField>
                  <FormField label="Grade (out of 100)">
                    <FormInput placeholder="Eg. 90"/>
                  </FormField>
                  <FormField label="Comments">
                    <FormInput placeholder="Eg." multiline />
                  </FormField>
                  <FormField >
                    <Button size="sm" submit>Submit</Button>
                  </FormField>
                </Form>
              </td>
            </tr>

*/