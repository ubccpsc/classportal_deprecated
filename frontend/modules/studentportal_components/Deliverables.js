import React from 'react'
import {Modal, ModalHeader, ModalFooter, ModalBody, Button, Card, Row, Col} from 'elemental'

export default React.createClass({
  getInitialState: function () {
    return {deliverablesObject:''};
  },
  getDeliverables: function () {
    console.log("Deliverables.js| Requesting deliverables");
    $.ajax({
      type: 'POST',
      url: 'http://localhost:4321/api/getDeliverables',
      data: {
        servertoken: localStorage.servertoken,
        username: localStorage.username,
        course: this.state.course
      },
      dataType: "json",
      success: function (response) {
        console.log("Deliverables.js| Retrieved "+response.length+" deliverables");
        this.setState({ deliverablesObject: response });
      }.bind(this),
      error: function (xhr, status, err) {
        console.log("Deliverables.js| Error retrieving deliverables!");
      }.bind(this)
    });
  },
  renderDeliverables: function () {
    var block = [];
    var deliverables = this.state.deliverablesObject;
    for (var index = 0; index < deliverables.length; index++){
      block[index] = (
        <div className="tg-wrap-deliverables" key={index}>
          <table className="tg">
            <tbody>
              <tr>
                <th className="tg-7wrc" colSpan="2">{deliverables[index].name}</th>
              </tr>
              <tr>
                <td className="tg-edam">Description</td>
                <td className="tg-value">{deliverables[index].description}</td>
              </tr>
              <tr>
                <td className="tg-edam">Criteria</td>
                <td className="tg-value">{deliverables[index].url}</td>
              </tr>
              <tr>
                <td className="tg-edam">Date open</td>
                <td className="tg-value">{deliverables[index].open}</td>
              </tr>
              <tr>
                <td className="tg-edam">Date due</td>
                <td className="tg-value">{deliverables[index].due}</td>
              </tr>
              <tr>
                <td className="tg-edam">Submit</td>
                <td className="tg-value">www.github.com</td>
              </tr>
            </tbody>
          </table><br/>
        </div>);
    }

    console.log("Deliverables.js| Rendering " + index + " deliverables");    
    return (<div>{block}</div>);
  },
  componentDidMount:function(){
    this.getDeliverables();
  },
  render: function () {
    return (
      <div className="module">
        <h3>Deliverables</h3><br/>
        {!!this.state.deliverablesObject && this.renderDeliverables()}
      </div>
    )}
})