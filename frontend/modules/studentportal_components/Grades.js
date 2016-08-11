import React from 'react'
import { Row, Col, Button, Alert, Spinner } from 'elemental'

export default React.createClass({
  getInitialState: function() {
    return {
      course:'410',
      numDeliverables:'0',
      gradesTrue:false,
      gradesObject:''
    };
  },
  getGrades: function () {
    function onSuccess(response) {
      console.log("Grades.js| getGrades() success! \nResponse: " + response);
      console.log("Grades.js| Response.length: " + response.length);
      //var arr = [0,2];
      this.setState({ gradesObject:response, gradesTrue:true } , function () {
        console.log("Grades.js| setState success! grades: " + this.state.gradesObject + this.state.gradesTrue.toString());
      });
    };

    $.ajax({
      type: 'POST',
      url: 'http://localhost:4321/api/getGrades',
      data: {
        servertoken: "temp",
        sid: this.props.sid
      },
      dataType: "json",
      success: onSuccess.bind(this),
      error: function (xhr, status, err) {
        console.log("getGrades() error!");
      }.bind(this)
    });
  },
  renderGrades: function () {
    console.log("Grades.js| renderGrades");
    var block = [];

    for (var index = 0; index < this.state.gradesObject.length; index++){
      console.log("index: "+index);
      block[index] = (
        <tr key={index}>
          <td className="tg-yw4l">{index+1}</td>
          <td className="tg-yw4l">{this.state.gradesObject[index]}</td>
          <td className="tg-yw4l">80</td>
        </tr>
      );
    }

    return (<tbody>{block}</tbody>)
  },
  componentDidMount:function(){
    console.log("Grades.js| sid: " + JSON.stringify(this.props.sid, null, 2));
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
            {this.state.gradesTrue && this.renderGrades()}
          </table>
        </div>
      </div>
    )}
})

//{this.state.gradesTrue && this.renderGrades()}