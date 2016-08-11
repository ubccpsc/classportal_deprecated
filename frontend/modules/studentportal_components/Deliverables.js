import React from 'react'
import {Modal, ModalHeader, ModalFooter, ModalBody, Button, Card, Row, Col} from 'elemental'

export default React.createClass({
  getInitialState: function () {
    return {
      modalIsOpen: true,
      data: [],
      numDeliverables:'',
      deliverablesObject: '',
      deliverablesTrue: false
    };
  },
  getDeliverables: function () {
    function onSuccess(response) {
      console.log("Deliverables.js| getDeliverables() success! \nResponse: " + JSON.stringify(response, null, 2));
      console.log("Deliverables.js| Response.length: " + response.length);
      
      this.setState({ numDeliverables: response.length, deliverablesObject:response, deliverablesTrue:true }, function () {
        console.log("Deliverables.js| setState success! numDeliverables: " + this.state.numDeliverables);
        console.log("Deliverables.js| setState success! deliverablesTrue: " + this.state.deliverablesTrue);
      });
    };

    $.ajax({
      type: 'POST',
      url: 'http://localhost:4321/api/getDeliverables',
      data: {
        servertoken: "temp",
        course: this.state.course
      },
      dataType: "json",
      success: onSuccess.bind(this),
      error: function (xhr, status, err) {
        console.log("getDeliverables() error!");
      }.bind(this)
    });
  },
  renderDeliverables: function () {
    console.log("Deliverables.js| renderDeliverable()");
    if (this.state.numDeliverables > 1) {
      var data = this.state.deliverablesObject;
      var block = [];
      for (var index = 0; index < this.state.numDeliverables; index++){
        console.log("Deliverables.js| rendering deliverable: " + index);      
        block[index] = (
          <div className="tg-wrap-deliverables" key={index}>
            <table className="tg">
              <tbody>
                <tr>
                  <th className="tg-7wrc" colSpan="2">{data[index].name}</th>
                </tr>
                <tr>
                  <td className="tg-edam">Description</td>
                  <td className="tg-value">{data[index].description}</td>
                </tr>
                <tr>
                  <td className="tg-edam">Criteria</td>
                  <td className="tg-value">{data[index].url}</td>
                </tr>
                <tr>
                  <td className="tg-edam">Date open</td>
                  <td className="tg-value">{data[index].open}</td>
                </tr>
                <tr>
                  <td className="tg-edam">Date due</td>
                  <td className="tg-value">{data[index].due}</td>
                </tr>
                <tr>
                  <td className="tg-edam">Submit</td>
                  <td className="tg-value">www.github.com</td>
                </tr>
              </tbody>
            </table><br/>
          </div>
        );
      }  
      return (<div>{block}</div>);
    }
  },
  componentDidMount:function(){
    this.getDeliverables();
  },
  render: function () {
    return (
      <div className="module">
        <h3>Deliverables</h3><br/>
        {this.state.deliverablesTrue && this.renderDeliverables()}
      </div>
    )}
});