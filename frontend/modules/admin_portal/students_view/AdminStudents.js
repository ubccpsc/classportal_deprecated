import React from 'react'
import { Form, FormRow, FormField, FormInput, FormIconField, FormSelect, Glyph, Button, Modal, ModalHeader, ModalBody, ModalFooter, Dropdown } from 'elemental'
import ContentModule from '../../shared_components/ContentModule'
import Ajax from '../../shared_components/Ajax'

export default React.createClass({
  getInitialState: function () {
    return {
      viewAll: true,
      modalIsOpen: false,
      labelArray: [],
      student: '',
      assnId: '',
      grade: '',
      comment: ''
    };
  },
  toggleView: function (e) {
    e.preventDefault();
    this.setState({ "viewAll": !this.state.viewAll }, function () {
      // console.log("AdminStudents.js| viewAll: " + this.state.viewAll);
    });
  },
  include: function (arr, obj) {
    var result = (arr.indexOf(obj) != -1);
    // console.log("AdminStudents.js| Checking if " + obj + " exists in " + JSON.stringify(arr) + ". Result: " + result.toString());
    return (result);
  },
  renderStudents: function () {
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
          {!!student.hasTeam ? "True" : "-" }</td>
        <td className="tg-yw4l">
          {!!student.username ?
            <a href={"http://github.com/" + student.username} target="blank" >
              {student.username}
            </a>
            : "-" }</td>
        <td className="tg-yw4l">
          <Button
            id={student.firstname + ' ' + student.lastname}
            size="sm"
            className="button-text"
            type="link-text"
            onClick={this.openModal}>View/Edit</Button>
        </td>
      </tr>
    )
  },
  openModal: function (event) {
    // console.log(event.target.id);
    this.setState({ student: event.target.id }, function () {
      this.setState({ modalIsOpen: true });
    });
  },
  closeModal: function () {
    this.setState({ modalIsOpen: false });
  },
  submitGrades: function () {
    // check for valid assignment
    if (!this.state.assnId) {
      alert("Error: assignment field not set.");
      return;
    }

    // convert grade from string to int
    var intGrade = parseInt(this.state.grade, 10);

    // check for valid grade
    if (isNaN(intGrade) || intGrade < 0 || intGrade > 100) {
      alert("Error: grade must by an integer between 0-100.");
      return;
    }

    // confirm before submitting new grade
    var submitMessage = "Please confirm new grade:\nStudent: " + this.state.student + "\nAssignment: " + this.state.assnId + "\nGrade: " + intGrade + "/100\nComment: " + this.state.comment;
    if (confirm(submitMessage)) {
      Ajax.submitGrade(
        this.state.student,
        this.state.assnId,
        intGrade,
        this.state.comment,
        function onSuccess() {
          alert("Success!")
          this.closeModal();
          window.location.reload(true);
        }.bind(this),
        function onError() {
          alert("Error submitting grades.")
        }.bind(this),
      );
    }
  },
  handleSelectAssignment: function (event) {
    // console.log(event);
    var delivs = this.props.deliverables;
    for (var index = 0; index < delivs.length; index++){
      if (event === delivs[index].name) {
        this.setState({ assnId: delivs[index].id });
      }
    }
  },
  setNewGrade: function (event) {
    // console.log(event.target.value);
    this.setState({ grade: event.target.value });
  },
  setNewComment: function (event) {
    // console.log(event.target.value);
    this.setState({ comment: event.target.value });
  },
  componentDidMount: function () {
    var delivs = this.props.deliverables;
    var labelArray = [];
    for (var index = 0; index < delivs.length; index++) {
      labelArray[index] = { 'label': delivs[index].name }
    }
    this.setState({ 'labelArray': labelArray });
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

        <Modal isOpen={this.state.modalIsOpen} onCancel={this.closeModal} backdropClosesModal>
          <ModalHeader text="Edit Grades" showCloseButton onClose={this.closeModal} />
          <ModalBody>
            <Form className="form" type="horizontal" >
              <FormField label="Student">
                <FormInput placeholder={this.state.student} disabled />
              </FormField>
              <FormField className="no-margin" label="Assn">
                <FormSelect options={this.state.labelArray} firstOption="Select" onChange={this.handleSelectAssignment} />
              </FormField>
              <FormField label="Grade (%)" onChange={this.setNewGrade}>
                <FormInput />
              </FormField>
              <FormField label="Comment" onChange={this.setNewComment}>
                <FormInput multiline />
              </FormField>
            </Form>
          </ModalBody>
          <ModalFooter>
            <Button type="danger" onClick={this.submitGrades}>Submit</Button>
            <Button type="link-cancel" onClick={this.closeModal}>Cancel</Button>
          </ModalFooter>
        </Modal>

      </ContentModule>
    )
  }
})