import React from 'react'
import {Modal, ModalHeader, ModalFooter, ModalBody, Button, Card, Row, Col} from 'elemental'
import ContentModule from '../shared_components/ContentModule'

export default React.createClass({
  getInitialState: function () {
    return {
      modalIsOpen: false,
      assnId: ""
    };
  },
  renderTable: function () {
    var that = this;
    var delivs = [];
    for (var index = 0; index < this.props.deliverables.length; index++) {
      delivs.push(that.renderOneRow(index));
    }
    return delivs;
  },
  renderOneRow: function (index) {
    var deliverable = this.props.deliverables[index];
    return (
      <tr key={index}>
        <td className="tg-edam">
          <a href={deliverable.url} target="blank" >{deliverable.name}</a>
        </td>
        <td className="tg-edam">{deliverable.open}</td>
        <td className="tg-edam">{deliverable.due}</td>
        <td className="tg-yw4l">
          { deliverable.gradesReleased && !!this.returnGradeAndComment(deliverable.id).grade
            ? this.returnGradeAndComment(deliverable.id).grade : "-" }
        </td>
        <td className="tg-yw4l">
          { deliverable.gradesReleased && !!this.returnGradeAndComment(deliverable.id).comment ?
            (<Button
              size="sm"
              className="button-text"
              type="link-text"
              onClick={this.openModal.bind(this, deliverable.id) }>
              View
            </Button>) : "-" }
        </td>
      </tr>
    );
  },
  returnGradeAndComment: function (assnId) {
    var thisGrade = _.find(this.props.grades, { 'assnId': assnId });
    if (thisGrade !== undefined) {
      return { 'grade': thisGrade.grade, 'comment': thisGrade.comment };
    } else {
      return { 'grade': "", 'comment': "" };
    }
  },
  openModal: function (assnId) {
    this.setState({ 'assnId': assnId }, function () {
      this.setState({ modalIsOpen: true });
    });
  },
  closeModal: function () {
    this.setState({ modalIsOpen: false });
  },
  render: function () {
    return (
      <ContentModule id="deliverables-module" title="Deliverables" initialHideContent={false}>
        <table className="tg">
          <tbody>
            <tr>
              <th className="tg-yw4l">Deliverable</th>
              <th className="tg-yw4l">Open</th>
              <th className="tg-yw4l">Due</th>
              <th className="tg-yw4l">Grade</th>
              <th className="tg-yw4l">Comment</th>
            </tr>
            {!!this.props.deliverables && this.renderTable() }
          </tbody>
        </table>

        <Modal isOpen={this.state.modalIsOpen} onCancel={this.closeModal} backdropClosesModal>
          <ModalHeader text="View Comment" showCloseButton onClose={this.closeModal} />
          <ModalBody>
            <p>{this.returnGradeAndComment(this.state.assnId).comment}</p>
          </ModalBody>
          <ModalFooter>
            <Button type="link-cancel" onClick={this.closeModal}>Cancel</Button>
          </ModalFooter>
        </Modal>

      </ContentModule>
    )
  }
})