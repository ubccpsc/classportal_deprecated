import React from 'react'
import { Form, FormRow, FormField, FormInput, FormIconField, FormSelect, Dropdown,
    Glyph, Button,
    Row, Col,
    Modal, ModalHeader, ModalBody, ModalFooter } from 'elemental'
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
              key={sid + ':' + firstname + ' ' + lastname}
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
    var thisGrade = this.returnGradesForStudent(sid, assnId);
    if (thisGrade !== undefined) {
      return { 'grade': thisGrade.grade, 'comment': thisGrade.comment };
    } else {
      return "";
    }
  },
  returnGradesForStudent: function (sid, assnId, placeholder) {
    var myGradesEntry = _.find(this.props.grades, { 'sid': sid });
    if (myGradesEntry !== undefined) {
      var thisGrade = _.find(myGradesEntry.grades, { 'assnId': assnId });
      if (thisGrade !== undefined) {
        return thisGrade;
      } 
    } else if (typeof placeholder === "undefined") {
      return undefined;
    }
    // construct a fake json for placeholders
    return {assnId: assnId, autotest: placeholder, coverage: placeholder, retrospective: placeholder, grade: placeholder, comment: placeholder};
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
  renderModalGrades: function (sid) {
    let grades = [];
    for (let index = 0; index < this.props.deliverables.length; index++) {
      let assignmentId = this.props.deliverables[index].id;
      grades[index] = (
        <Row key={"m"+index}>
          <Col sm="10%">
          <FormField>
            <FormInput placeholder={assignmentId} disabled size="sm"/>
          </FormField>
          </Col>
          <Col sm="15%">
            <FormField>
              <FormInput size="sm" 
                onChange={this.setNewAutotest.bind(this, this.state.sid, assignmentId)}
                placeholder={this.returnGradesForStudent(this.state.sid, assignmentId, "Auto test").autotest}/>
            </FormField>
          </Col>
          <Col sm="15%">
            <FormField>
              <FormInput size="sm" 
              onChange={this.setNewCoverage.bind(this, this.state.sid, assignmentId)}
              placeholder={this.returnGradesForStudent(this.state.sid, assignmentId, "Coverage ").coverage}/>
            </FormField>
          </Col>
          <Col sm="15%">
            <FormField>
              <FormInput size="sm"
              onChange={this.setNewRetrospective.bind(this, this.state.sid, assignmentId)} 
              placeholder={this.returnGradesForStudent(this.state.sid, assignmentId, "Retrospective").retrospective}/>
            </FormField>
          </Col>
          <Col sm="15%">
            <FormField>
              <FormInput size="sm"
              onChange={this.setNewGrade.bind(this, this.state.sid, assignmentId)} 
              placeholder={this.returnGradesForStudent(this.state.sid, assignmentId, "Final grade").grade}/>
            </FormField>
          </Col>
          <Col sm="30%">
            <FormField label="Comment">
              <FormInput multiline size="sm"
              onChange={this.setNewComment.bind(this, this.state.sid, assignmentId)}
              placeholder={this.returnGradesForStudent(this.state.sid, assignmentId, "Comment").comment}/>
            </FormField>
          </Col>
        </Row>
      );
    }
    return grades;
  },
  openModal: function (sid, firstname, lastname, event) {
    let that = this;
    this.setState({ 'sid': sid }, function () {
      this.setState({ student: firstname + ' ' + lastname, grades: that.props.grades, studentGrade: {'sid': sid, grades: []} }, function () {
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
  isValidGrade: function(grade, key) {
    var intGrade = parseInt(grade[key], 10);
    // check for valid grade
    if (isNaN(intGrade) || intGrade < 0 || intGrade > 100) {
      return false;
    }
    return true;
  },
    isValidRetrospective: function(retro, key) {
      if (retro && retro !== "") {
          var retroGrade = Number(Number(retro[key]).toFixed(1));
          // check for valid grade
          return (
              retroGrade === 0 ||
              retroGrade === 0.2 ||
              retroGrade === 0.4 ||
              retroGrade === 0.6 ||
              retroGrade === 0.8 ||
              retroGrade === 1
          );
      } else {
        return false;
      }
    },
  submitGrades: function () {
    // confirm before submitting new grade
    var resubmitMessage = "This student has already been graded for assingments...\n";

    //check if student already has grade assigned
    var studentIndex = _.findIndex(this.props.grades, { "sid": this.state.sid });
    var oldGrades = this.props.grades[studentIndex].grades;
    var newGrades = this.state.studentGrade.grades;
    var data = { "sid": this.state.sid, grades: [] };

    var hasChanges = false;
    for (let index = 0; index < this.props.deliverables.length; index++) {
      var assnId = this.props.deliverables[index].id;
      var newGradeIdx = _.findIndex(newGrades, { "assnId": assnId });
      var oldGradeIdx = _.findIndex(oldGrades, { "assnId": assnId });

      if (newGradeIdx !== -1) {
        if (oldGradeIdx !== -1) {
          // A grade was updated
          resubmitMessage += '\n[' + assnId + '] data will be overwritten. Is that correct?';
          hasChanges = true;
        }
        if (!(this.isValidGrade(newGrades[newGradeIdx], 'grade'))){
          alert("Error: [" +assnId+ "] grades must be integers between 0-100.");
          return;
        }
        if (!(this.isValidRetrospective(newGrades[newGradeIdx], 'retrospective'))){
            alert("Error: [" +assnId+ "] retrospective grades must be integers between 0-1 in 0.2 increments.");
            return;
        }

        data.grades.push(newGrades[newGradeIdx]);
      } else if (oldGradeIdx !== -1) {
        // A grade that already exists and was not updated
        data.grades.push(oldGrades[oldGradeIdx]);
      }
    }

    if (hasChanges) {
      if (!confirm(resubmitMessage)) {
        return;
      }
    }
    
    Ajax.submitAllGrades(
      data,
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
  setNewStudentGrade: function(sid, assnId, event, key) {
    let newStudentGrade = this.state.studentGrade;
    var index = -1;
    for (let i = 0; i < newStudentGrade.grades.length; i++){
      if (newStudentGrade.grades[i].assnId === assnId){
        index = i;
        break;
      }
    }
    if (index === -1){
        let savedStudentGrades = this.returnGradesForStudent(sid, assnId, "");
        // dereference to original object to prevent UI update prior to saving grade
        savedStudentGrades = JSON.parse(JSON.stringify(savedStudentGrades));
        if (savedStudentGrades !== undefined) {
            // include previously saved grades
            newStudentGrade.grades.push(savedStudentGrades);
        } else {
            newStudentGrade.grades.push({assnId: assnId});
        }
      index = newStudentGrade.grades.length - 1;
    }
    newStudentGrade.grades[index][key] = event.target.value;
    this.setState({ studentGrade: newStudentGrade });
  },
  setNewAutotest: function (sid, assnId, event) {
    this.setNewStudentGrade(sid, assnId, event, 'autotest');
  },
  setNewCoverage: function (sid, assnId, event) {
    this.setNewStudentGrade(sid, assnId, event, 'coverage');
  },
  setNewRetrospective: function (sid, assnId, event) {
    this.setNewStudentGrade(sid, assnId, event, 'retrospective');
  },
  setNewGrade: function (sid, assnId, event) {
    this.setNewStudentGrade(sid, assnId, event, 'grade');
  },
  setNewComment: function (sid, assnId, event) {
    this.setNewStudentGrade(sid, assnId, event, 'comment');
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

        <Modal isOpen={this.state.modalIsOpen} onCancel={this.closeModal} width={825} backdropClosesModal>
          <ModalHeader text={"Edit grades for :: " + this.state.student} showCloseButton onClose={this.closeModal} />
          <ModalBody>
            <Form className="form" type="inline">
              {this.renderModalGrades(this.state.sid)}
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
