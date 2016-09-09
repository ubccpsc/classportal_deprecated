import React from 'react'
import {Modal, ModalHeader, ModalFooter, ModalBody, Button, Card, Row, Col} from 'elemental'
import ContentModule from '../shared_components/ContentModule'

export default React.createClass({
  renderDeliverables: function () {
    var that = this;
    var delivs = [];
    for (var index = 0; index < this.props.deliverables.length; index++) {
      delivs.push(that.renderDeliverable(index));
    }
    return delivs;
  },
  renderDeliverable: function (index) {
    var deliverable = this.props.deliverables[index];
    return (
      <tr key={index}>
        <td className="tg-edam">
          <a href={deliverable.url} target="blank" >{deliverable.name}</a>
        </td>
        <td className="tg-edam">{deliverable.open}</td>
        <td className="tg-edam">{deliverable.due}</td>
        <td className="tg-yw4l">-</td>
      </tr>
    );
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
            </tr>
            {!!this.props.deliverables && this.renderDeliverables() }
          </tbody>
        </table>
      </ContentModule>
    )
  }
})