import React from 'react'
import {Modal, ModalHeader, ModalFooter, ModalBody, Button, Card, Row, Col} from 'elemental'

export default React.createClass({
  renderDeliverables: function () {
    console.log("Deliverables.js| Rendering deliverables");
    var block = [];
    var deliverables = this.props.deliverables;
    
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
                <td className="tg-value"><a href={deliverables[index].url} target="blank">{deliverables[index].url}</a></td>
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
                <td className="tg-value"><a href="http://www.github.com" target="blank">http://www.github.com</a></td>
              </tr>
            </tbody>
          </table><br/>
        </div>);
    };
    
    return (<div>{block}</div>);
  },
  render: function () {
    return (
      <div className="module">
        <h3>Deliverables</h3><br/>
        {!!this.props.deliverables && this.renderDeliverables()}
      </div>
    )}
})