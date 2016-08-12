import React from 'react'
import { Row, Col, Button, Alert, Spinner } from 'elemental'

export default React.createClass({
  getInitialState: function() {
    return {gradesObject:''};
  },
  getGrades: function () {
    console.log("Grades.js| Requesting grades");
    $.ajax({
      type: 'POST',
      url: 'http://localhost:4321/api/getGrades',
      data: {
        servertoken: localStorage.servertoken,
        username: localStorage.username,
        sid: this.props.sid
      },
      dataType: "json",
      success: function (response) {
        console.log("Grades.js| Retrieved grades: " + response);
        this.setState({ gradesObject: response });
      }.bind(this),
      error: function (xhr, status, err) {
        console.log("Grades.js| Error getting grades!");
      }.bind(this)
    });
  },
  renderGrades: function () {
    var block = [];
    for (var index = 0; index < this.state.gradesObject.length; index++){
      block[index] = (
        <tr key={index}>
          <td className="tg-yw4l">{index+1}</td>
          <td className="tg-yw4l">{this.state.gradesObject[index]}</td>
          <td className="tg-yw4l">80</td>
        </tr>);
    }

    console.log("Grades.js| Rendering grades");    
    return (<tbody>{block}</tbody>)
  },
  componentDidMount: function () {
    this.getGrades();    
  },
  render: function () {
    return (
      <div className="module">
        <h3>Grades</h3><br/>
   
        <div className="tg-wrap">
          <table className="tg">
            <tbody>
              <tr>
                <th className="tg-yw4l">Assignment</th>
                <th className="tg-yw4l">Grade</th>
                <th className="tg-yw4l">Class Average</th>
              </tr>
            </tbody>
            {!!this.state.gradesObject && this.renderGrades()}
          </table>
        </div>
      </div>
    )}
})