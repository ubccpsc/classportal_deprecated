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
  include: function(arr, obj) {
      var result = (arr.indexOf(obj) != -1);
      console.log("AdminStudents.js| Checking if " + obj + " exists in " + JSON.stringify(arr) + ". Result: " + result.toString());
      return (result);
  },
  renderStudents: function() {
    var that = this;
    //todo: decide how to display myStudents properly
    var myStudents = this.props.myTeams;
    var students = [];
    for (var index = 0; index < this.props.students.length; index++) {
      //if viewAll is true, render all students; otherwise, only render students from myTeams.
      if (that.state.viewAll ? true : this.include(myStudents, index.toString())) {
        students.push(that.renderOneStudent(index));
      }
    }
    return students;
  },
  renderOneStudent: function (index) {
    var student = this.props.students[index];
    return (
      <tr key={index}>
        <td className="tg-yw4l">{student.sid}</td>
        <td className="tg-yw4l">{student.lastname}</td>
        <td className="tg-yw4l">{student.firstname}</td>
        <td className="tg-yw4l">
          {!!student.hasTeam ? "#": "-" }</td>
        <td className="tg-yw4l">
          {!!student.github_name ?
            <a href={"http://github.com/" + student.github_name} target="blank" >
              {student.github_name}
            </a>
            : "-" }</td>
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
            {!!this.props.students && this.renderStudents() }
          </tbody>
        </table>
      </ContentModule>
    )}
})