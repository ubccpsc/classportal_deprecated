import React from 'react'
import { Form, FormRow, FormField, FormInput, FormIconField, FormSelect, Glyph, Button } from 'elemental'
import ContentModule from '../../shared_components/ContentModule'

export default React.createClass({
  renderDeliverables: function() {
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
        <td className="tg-edam">{deliverable.name}</td>
        <td className="tg-yw4l">
          <a href={deliverable.url} target="blank" >View</a>
        </td>
        <td className="tg-edam">{deliverable.open}</td>
        <td className="tg-edam">{deliverable.due}</td>
        <!--
         Don't show grad release date
        <td className="tg-edam">{deliverable.gradeRelease}</td>
        -->
      </tr>
    );
  },
  render: function () {
    return (
      <ContentModule id="admin-deliverables-module" title="Deliverables" initialHideContent={false}>
        <table className="tg">
          <tbody>
            <tr>
              <th className="tg-yw4l">Name</th>
              <th className="tg-yw4l">Link</th>
              <th className="tg-yw4l">Open</th>
              <th className="tg-yw4l">Due</th>
              <!--
              Don't show grad release date
              <th className="tg-yw4l">Release</th>
              -->
            </tr>
            {!!this.props.deliverables && this.renderDeliverables() }
          </tbody>
        </table>
      </ContentModule>
  )}
})