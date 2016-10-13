import React from 'react'
import { Form, FormRow, FormField, FormInput, FormIconField, FormSelect, Glyph, Button, Modal, ModalHeader, ModalBody, ModalFooter, Dropdown } from 'elemental'
import ContentModule from '../../shared_components/ContentModule'
import Ajax from '../../shared_components/Ajax'
import _ from 'lodash';

export default React.createClass({
  getInitialState: function () {
    return {
      viewAll: true,
      modalIsOpen: false,
      gradesModalIsOpen: false,
      labelArray: [],
      student: '',
      sid: '',
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
  renderGrades: function () {
    var rows = [];
    var gradesFile = this.props.grades;
    var studentIndex = _.findIndex(gradesFile, { sid: this.state.sid });

    if (studentIndex !== -1) {
      if (gradesFile[studentIndex].grades.length < 1) {
        var emptyRow = (
          <tr key="0">
            <td className="tg-yw4l">-</td>
            <td className="tg-yw4l">-</td>
            <td className="tg-yw4l">-</td>
          </tr>
        );
        rows.push(emptyRow);
      } else {
        for (var index = 0; index < gradesFile[studentIndex].grades.length; index++) {
          var currentGrade = gradesFile[studentIndex].grades[index];
          var row = (
            <tr key={index}>
              <td className="tg-yw4l">{currentGrade.assnId}</td>
              <td className="tg-yw4l">{currentGrade.grade}</td>
              <td className="tg-yw4l">{currentGrade.comment}</td>
            </tr>
          );
          rows.push(row);
        }
      }
    } else {
      alert("Error loading student: " + this.state.sid);
    }

    return rows;
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
            id={student.sid + ':' + student.firstname + ' ' + student.lastname}
            size="sm"
            className="button-text"
            type="link-text"
            onClick={this.openGradesModal}>View
          </Button>
          &nbsp; /&nbsp;
          <Button
            id={student.sid + ':' + student.firstname + ' ' + student.lastname}
            size="sm"
            className="button-text"
            type="link-text"
            onClick={this.openModal}>Edit
          </Button>
        </td>
      </tr>
    )
  },
  openModal: function (event) {
    var lines = event.target.id.split(':');
    console.log(lines);
    this.setState({ sid: lines[0] }, function () {
      this.setState({ student: lines[1] }, function () {
        this.setState({ modalIsOpen: true });
      });
    });
  },
  closeModal: function () {
    this.setState({ modalIsOpen: false });
  },
  openGradesModal: function (event) {
    var lines = event.target.id.split(':');
    // console.log(lines);
    this.setState({ sid: lines[0] }, function () {
      this.setState({ student: lines[1] }, function () {
        this.setState({ gradesModalIsOpen: true });
      });
    });
  },
  closeGradesModal: function () {
    this.setState({ gradesModalIsOpen: false });
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
    var resubmitMessage = "This assignment has already been assigned a grade. Overwrite?";

    //check if student already has grade assigned
    var studentIndex = _.findIndex(this.props.grades, { "sid": this.state.sid });
    var assnIndex = _.findIndex(this.props.grades[studentIndex].grades, { "assnId": this.state.assnId });

    if (confirm(submitMessage)) {
      if (assnIndex !== -1) {
        var oldGrade = this.props.grades[studentIndex].grades[assnIndex].grade;
        var oldComment = this.props.grades[studentIndex].grades[assnIndex].comment;
        if (!confirm(resubmitMessage + "\n\nPrevious:\nGrade: " + oldGrade + "\nComment: " + oldComment)) {
          return;
        }
      }
      Ajax.submitGrade(
        this.state.sid,
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
    for (var index = 0; index < delivs.length; index++) {
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

        <Modal isOpen={this.state.gradesModalIsOpen} onCancel={this.closeGradesModal} backdropClosesModal>
          <ModalHeader text={"View Grades: " + this.state.student } showCloseButton onClose={this.closeGradesModal} />
          <ModalBody>
            <Form className="form" type="horizontal" >
              <table className="tg">
                <tbody>
                  <tr>
                    <th className="tg-yw4l">AssnId #</th>
                    <th className="tg-yw4l">Grade</th>
                    <th className="tg-yw4l">Comment</th>
                  </tr>
                  {this.state.gradesModalIsOpen && this.renderGrades() }
                </tbody>
              </table>
            </Form>
          </ModalBody>
          <ModalFooter>
            <Button type="link-cancel" onClick={this.closeGradesModal}>Cancel</Button>
          </ModalFooter>
        </Modal>

      </ContentModule>
    )
  }
})
