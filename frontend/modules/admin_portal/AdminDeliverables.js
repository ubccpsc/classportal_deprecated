import React from 'react'
import { Form, FormRow, FormField, FormInput, FormIconField, FormSelect, Glyph, Button } from 'elemental'

export default React.createClass({
  render: function () {
    return (
      <AdminDelivs deliverablesObject={{ "description": "description1" }}/>
    )}
})

const AdminDelivs = React.createClass({
  getInitialState: function () {
    return { deliverablesObject: '' };
  },
  renderDeliverables: function () {
    var deliverables = [];
    for (var index = 1; index < 6; index++) {
      deliverables[index] = this.renderDeliverable(index);
    }
    return deliverables;
  },
  componentDidMount: function () {
    console.log("AdminDeliverables.js| Requesting deliverables");
    $.ajax({
      type: 'POST',
      url: 'http://localhost:4321/api/getDeliverables',
      data: {
        "servertoken": localStorage.servertoken,
        "admin": localStorage.admin,
      },
      dataType: "json",
      success: function (response) {
        console.log("AdminDeliverables.js| Retrieved "+response.length+" deliverables");
        this.setState({ deliverablesObject: response }, function () {
          console.log("AdminDeliverables.js| deliverablesObject set!");
        });
      }.bind(this),
      error: function (xhr, status, err) {
        console.log("AdminDeliverables.js| Error retrieving deliverables!");
      }.bind(this)
    });
  },
  renderDeliverable: function(index) {
    return (
      <div className="tg-wrap-deliverables" key={index}>
        <table className="tg">
          <tbody>
            <tr>
                <th className="tg-7wrc" colSpan="2">Deliverable {index}</th>
            </tr>
            <tr>
              <td className="tg-edam">Description</td>
              <td className="tg-value">{this.props.deliverablesObject.description}</td>
            </tr>
            <tr>
              <td className="tg-edam">Criteria</td>
              <td className="tg-value"></td>
            </tr>
            <tr>
              <td className="tg-edam">Date open</td>
              <td className="tg-value"></td>
            </tr>
            <tr>
              <td className="tg-edam">Date due</td>
              <td className="tg-value"></td>
            </tr>
            <tr>
              <td className="tg-edam">Students Marked</td>
              <td className="tg-value">0 / 50</td>
            </tr>
          </tbody>
        </table><br/>
      </div>
    );
  },
  render: function () {
    var options1 = [{"label":"Individual Marks"}];
    return (
      <div className="module">
        <h3>Deliverables</h3><br/>
        {this.renderDeliverables()}
      </div>  
    )}
})