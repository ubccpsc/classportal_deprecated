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
      console.log("AdminStudents.js| viewAll: " + this.state.viewAll);
    });
  },
  renderStudents: function () {
    var allStudents = this.props.students;
    var students = [];
    if (this.state.viewAll) {
      for (var index = 1; index < 6; index++) {
        students[index] = this.renderStudent(index);
      }
    }
    else {
      for (var index = 1; index < 6; index++) {
        if (index % 2){
          students[index] = this.renderStudent(index);
        }
      }
    }
    return students;
  },
  renderStudent: function (index) {
    return (
      <div className="tg-wrap-deliverables" key={index}>
        <table className="tg">
          <tbody>
            <tr>
              <th className="tg-7wrc" colSpan="2">Michael Sargent</th>
            </tr>
            <tr>
              <td className="tg-edam">SID</td>
              <td className="tg-value">54813118</td>
            </tr>
            <tr>
              <td className="tg-edam">CSID</td>
              <td className="tg-value">a6j8</td>
            </tr>
            <tr>
              <td className="tg-edam">Team</td>
              <td className="tg-value">5</td>
            </tr>
            <tr>
              <td className="tg-edam">Github</td>
              <td className="tg-value">http://github.com/mksarge</td>
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
      <ContentModule id="admin-students-module" title={this.state.viewAll ? "All Students" : "My Students"} initialHideContent={false}>
        <Form id="text-center" onSubmit={this.toggleView} >
          <FormField>    
            <Button type={this.state.viewAll ? "hollow-primary" : "primary"} submit size="sm">Toggle View</Button>&nbsp;
          </FormField>
        </Form>
        {!!this.props.students && this.renderStudents()}
      </ContentModule>
    )}
})




/*

        <div className="module">
          <h3>Students View</h3><br/>
          {this.renderAllTeams()}
        </div>
        
          
  updateSelect: function() {
    
  },


gradeSubmit: function (e) {
    e.preventDefault();
    alert("Grade Submission: Team 1 - Assignment 2");
  },

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