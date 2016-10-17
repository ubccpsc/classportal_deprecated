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
    this.setState({ "viewAll": !this.state.viewAll });
  },
  renderStudents: function () {
    var that = this;
    var students = [];

    for (var index = 0; index < this.props.students.length; index++) {
      var thisStudent = this.props.students[index];
      var thisTeam = this.getTeamFromSid(thisStudent.sid).toString();
      let isInMyGroup = _.some(this.props.myTeams, function (oneOfMyTeams) {
        return oneOfMyTeams === thisTeam;
      });

      // if viewAll is true, render all students; otherwise, only render students who are part of groups the current admin is responsible for.
      if (that.state.viewAll ? true : isInMyGroup) {
        students.push(that.renderOneStudent(thisStudent, index));
      }
    }
    return students;
  },
  renderOneStudent: function (student, index) {
    return (
      <tr key={index} >
        <td className="tg-yw4l" id="strongBorderLeft">
          {student.sid}
        </td>
        <td className="tg-yw4l2">
          {student.lastname + ", " + student.firstname}
        </td>
        <td className="tg-yw4l">
          {!!student.username ?
            <a href={"http://github.com/" + student.username} target="blank" >
              {student.username}
            </a>
            : "-" }
        </td>
        <td className="tg-yw4l">
          {student.hasTeam ? this.getTeamFromSid(student.sid) : "-" }
        </td>
        <td className="tg-yw4l" id="strongBorderRight">
          <Button
            size="sm"
            className="button-text"
            type="link-text"
            onClick={this.openModal.bind(this, student.sid, student.firstname, student.lastname) }>Submit
          </Button>
        </td>
        {this.renderDeliverables(student.sid, student.firstname, student.lastname) }
      </tr>
    );
  },
  renderDeliverables: function (sid, firstname, lastname) {
    let delivs = [];
    for (let index = 0; index < this.props.deliverables.length; index++) {
      let grade = this.returnGradeAndComment(sid, this.props.deliverables[index].id).grade;
      delivs[index] = (
        <td className="tg-yw4l" key={index} id={index === (this.props.deliverables.length - 1) ? "strongBorderRight" : ""}>
          {!!grade && (
            <Button
              id={sid + ':' + firstname + ' ' + lastname}
              size="sm"
              className="button-text"
              type="link-text"
              onClick={this.openGradesModal}>
              { grade + "%" }
            </Button>) }
        </td>);
    }
    return delivs;
  },
  returnGradeAndComment: function (sid, assnId) {
    var myGradesEntry = _.find(this.props.grades, { 'sid': sid });
    if (myGradesEntry !== undefined) {
      var thisGrade = _.find(myGradesEntry.grades, { 'assnId': assnId });
      if (thisGrade !== undefined) {
        return { 'grade': thisGrade.grade, 'comment': thisGrade.comment };
      } else {
        return "";
      }
    } else {
      return "";
    }
  },
  renderGrades: function () {
    var rows = [];
    var myGradesEntry = _.find(this.props.grades, { sid: this.state.sid });

    if (myGradesEntry !== undefined) {
      if (myGradesEntry.grades.length < 1) {
        var emptyRow = (
          <tr key="0">
            <td className="tg-yw4l">-</td>
            <td className="tg-yw4l">-</td>
            <td className="tg-yw4l">-</td>
          </tr>
        );
        rows.push(emptyRow);
      } else {
        for (var index = 0; index < myGradesEntry.grades.length; index++) {
          var currentGrade = myGradesEntry.grades[index];
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
  getTeamFromSid: function (sid) {
    let teamEntry = _.find(this.props.teams, function (team) {
      return _.some(team.members, function (value) {
        return value === sid;
      });
    });

    if (teamEntry !== undefined) {
      return teamEntry.id;
    } else {
      return -1;
    }
  },
  renderDeliverableHeaders: function () {
    let headers = []
    for (let index = 0; index < this.props.deliverables.length; index++) {
      headers[index] = (
        <th
          key={index}
          className="tg-yw4l"
          id={index === (this.props.deliverables.length - 1) ? "strongBorderRight" : ""}>
          {this.props.deliverables[index].id}
        </th>
      );
    }
    return headers;
  },
  openModal: function (sid, firstname, lastname, event) {
    this.setState({ 'sid': sid }, function () {
      this.setState({ student: firstname + ' ' + lastname }, function () {
        this.setState({ modalIsOpen: true });
      });
    });
  },
  openGradesModal: function (event) {
    var lines = event.target.id.split(':');
    this.setState({ sid: lines[0] }, function () {
      this.setState({ student: lines[1] }, function () {
        this.setState({ gradesModalIsOpen: true });
      });
    });
  },
  closeModal: function () {
    this.setState({ modalIsOpen: false });
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
        // alert("Success!")
        this.closeModal();
        window.location.reload(true);
      }.bind(this),
      function onError() {
        alert("Error submitting grades.")
      }.bind(this),
    );
  },
  handleSelectAssignment: function (event) {
    var delivs = this.props.deliverables;
    for (var index = 0; index < delivs.length; index++) {
      if (event === delivs[index].name) {
        this.setState({ assnId: delivs[index].id }, function () {
          let gradeEntry = this.returnGradeAndComment(this.state.sid, this.state.assnId);
          this.setState({ grade: gradeEntry.grade }, function () {
            this.setState({ comment: gradeEntry.comment }, function () {
            });
          });
        });
      }
    }
  },
  setNewGrade: function (event) {
    this.setState({ grade: event.target.value });
  },
  setNewComment: function (event) {
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
            <Button type={this.state.viewAll ? "hollow-primary" : "primary"} submit size="sm">Toggle</Button>&nbsp;
          </FormField>
        </Form>

        <div className="scrollingTable">
          <table className="tg">
            <tbody>
              <tr>
                <th id="strongBorderLeft" className="tg-yw4l">SID</th>
                <th className="tg-yw4l">Name</th>
                <th className="tg-yw4l">GitHub</th>
                <th className="tg-yw4l">Team</th>
                <th id="strongBorderRight" className="tg-yw4l">Grades</th>
                {this.renderDeliverableHeaders() }
              </tr>
              {!!this.props.students && this.renderStudents() }
            </tbody>
          </table>
        </div>

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
                <FormInput placeholder={this.state.grade} />
              </FormField>
              <FormField label="Comment" onChange={this.setNewComment}>
                <FormInput multiline  placeholder={this.state.comment} />
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
                    <th className="tg-yw4l">Deliverable</th>
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
