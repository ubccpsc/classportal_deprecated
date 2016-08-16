import React from 'react'
import { Form, FormRow, FormField, FormInput, FormIconField, FormSelect, Glyph, Button } from 'elemental'

export default React.createClass({
  renderDeliverables: function () {
    var deliverables = this.props.deliverables;
    for (var index = 0; index < deliverables.length; index++) {
      deliverables[index] = (
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
                <td className="tg-edam">Students Marked</td>
                <td className="tg-value">0 / 50</td>
              </tr>
            </tbody>
          </table><br/>
        </div>);
    }
    return deliverables;
  },
  render: function () {
    return (
      <div className="module">
        <h3>Deliverables</h3><br/>
        {!!this.props.deliverables && this.renderDeliverables()}
      </div>
    )}
})