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
      console.log("AdminStudents.js| viewAll: " + this.state.viewAll);
    });
  },
  renderTable: function () {
    var studentsObject = this.props.students;
    var myTeams = this.props.teams;
    var numStudents = studentsObject.length;
    var table;
    var that = this;

    function include(arr, obj) {
      var result = (arr.indexOf(obj) != -1);
      console.log("AdminStudents.js| Checking if " + obj + " exists in " + JSON.stringify(arr) + ". Result: " + result.toString());
      return (result);
    }
    
    function renderStudents(studentsObject) {
      var students = [];
      for (var index = 0; index < numStudents; index++) {
        //if viewAll is true, render all students; otherwise, only render students from myTeams.
        if (that.state.viewAll ? true : include(myTeams, index.toString())) {
          students.push(that.renderStudent(studentsObject[index]));
        }
      }
      return students;
    }  

    table = (
      <table className="tg">
        <tbody>
          <tr>
            <th className="tg-yw4l">Student #</th>
            <th className="tg-yw4l">Last</th>
            <th className="tg-yw4l">First</th>
            <th className="tg-yw4l">Team</th>
            <th className="tg-yw4l">GitHub</th>
            <th className="tg-yw4l">Grades</th>
          </tr>
          {renderStudents(studentsObject)}
        </tbody>
      </table>
    );

    return table;
  },
  renderStudent: function (studentObject) {
    return (
      <tr>
        <td className="tg-yw4l">{studentObject.sid}</td>
        <td className="tg-yw4l">{studentObject.lastname}</td>
        <td className="tg-yw4l">{studentObject.firstname}</td>
        <td className="tg-yw4l">#</td>
        <td className="tg-yw4l">
          {!!studentObject.github_name ?
            <a href={"http://github.com/" + studentObject.github_name} target="blank" >
              {studentObject.github_name}
            </a>
            : "Not registered" }
        </td>
        <td className="tg-yw4l">
          <a>View/Edit</a>
        </td>
      </tr>
    )
  },
  render: function () {
    return (
      <ContentModule id="admin-students-module" title={this.state.viewAll ? "All Students" : "My Students"} initialHideContent={false}>
        <Form id="text-center" onSubmit={this.toggleView} >
          <FormField>    
            <Button type={this.state.viewAll ? "hollow-primary" : "primary"} submit size="sm">Toggle View</Button>&nbsp;
          </FormField>
        </Form>
        {!!this.props.students && this.renderTable()}
      </ContentModule>
    )}
})