//parent component for all content modules.
//required props: id (string), title (string), initialHideContent (boolean)

import React from 'react'
import { Form, FormRow, FormField,
  FormInput, FormIconField, FormSelect, Dropdown,
  Glyph, Button, ButtonGroup, Row, Col,
  Modal, ModalHeader, ModalBody, ModalFooter 
} from 'elemental'
import StarRatingComponent from 'react-star-rating-component';
import config from 'config'
import Ajax from '../shared_components/Ajax'



export default React.createClass({
  getInitialState: function () {
    return { hideContent: false, app: this.props.app };
  },
  showOrHide: function (e) {
    e.preventDefault;
    this.setState({ hideContent: !this.state.hideContent });
  },
  alignLeft: function() {
    return { textAlign: "left", paddingLeft: "15px" };
  },
  getAppRatting: function() {
    var size = this.state.app.comments.length;
    var stars = 0
    var apps = this.state.app.comments.forEach(function(comment) {
      stars += comment.ratting;
    });
    return Math.floor((stars / size));

  },
  updateComments: function(){
    // var submitMessage = "You are about to change the app's comments.\nThis will affect which comments students will be able to see or not. Are you sure?"
    // if (!confirm(submitMessage)) {
    //     return;
    // }

    var data = this.state.app.comments;
    var appID = this.state.app.id;
    

    Ajax.updateComments(
      appID, data,
      function onSuccess() {
        alert("Success!")
        window.location.reload(true);
      }.bind(this),
      function onError() {
        alert("Error updating comments.")
      }.bind(this),
    );
  },
  approveDisapprove: function(index) {
    var newApp = this.state.app;
    newApp.comments[index].approved = !newApp.comments[index].approved;
    this.setState({app : newApp});
  },
  renderComments: function() {
    var display = {
      display: this.state.hideContent ? "none" : "flex",
      paddingTop: "10px",
      paddingBottom: "10px",
    }
    var that = this;
    var appName = this.state.app.name;
    
    var comments = this.state.app.comments.map(function(comment, i) {
      var commentId = appName + "-c" + i;
      var toggleComment;
      if (that.props.admin) {
        toggleComment = (
          <Col sm="5%">
            <Button size="xs" onClick={that.approveDisapprove.bind(that, i)}>
              <Glyph icon={comment.approved ? "check" : "lock"}/>&nbsp;
            </Button>
          </Col>
        )
      } else {
        toggleComment = (<Col sm="5%"><Glyph icon={comment.approved ? "check" : "lock"}/>&nbsp;</Col>)
      }

      return (
        <div>
          <Row style={display}>
            {toggleComment}
            <Col sm="80%" style={that.alignLeft()}>
              {that.props.admin && 
                <strong>{comment.student}:&nbsp;</strong>
              }
              {comment.description}
            </Col>
            <Col sm="10%"><small><StarRatingComponent editing={false} name={commentId} starCount={comment.ratting} value={0}/></small></Col>
          </Row>
        </div>
      )
    });

    return comments;
  },
  render: function () {
    var grayLineStyle = { 
      backgroundColor: "#f5f5f5",
    };

    var whiteLineStyle = { 
    };
    
    return (
      <div style={ this.props.index % 2 == 0 ? grayLineStyle : whiteLineStyle }>
        <Row style={{paddingTop: "10px"}}>
          <Col sm="20%">
            <h4>{this.state.app.name}</h4>
          </Col>
          <Col sm="55%" style={this.alignLeft()}>
            {this.state.app.description}
          </Col>
          <Col sm="25%">
            <ButtonGroup>
              <Button size="xs" onClick={this.state.openModal}><Glyph icon="thumbsup"/>&nbsp; Rate</Button>
              <Button size="xs" onClick={this.showOrHide}><Glyph icon="comment"/>&nbsp; Comments</Button>
              {this.props.admin && 
                <Button size="xs" onClick={this.updateComments}><Glyph icon="check"/>&nbsp; Update</Button>
              }
            </ButtonGroup>
          </Col>
          <Col sm="20%">
          <StarRatingComponent editing={false} name="app-rating" starCount={5} value={this.getAppRatting()}/>
          </Col>
        </Row >
        <br />
        <div >{this.renderComments()}</div>
        <br />
      </div>
    )
  }
})