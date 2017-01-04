import React from 'react'
import Logout from '../shared_components/Logout'
import CreateTeam from '../shared_components/CreateTeam'
import Ajax from '../shared_components/Ajax'
import ContentModule from '../shared_components/ContentModule'
import AppContent from './AppContent'
import StarRatingComponent from 'react-star-rating-component';

import { Form, FormRow, FormField, FormInput, FormIconField, FormSelect, Dropdown,
    Glyph, Button, ButtonGroup,
    Row, Col,
    Modal, ModalHeader, ModalBody, ModalFooter } from 'elemental'

export default React.createClass({
  getInitialState: function () {
    return {
      loaded: false,
      files: {
        "appsArray": []
      }
    };
  },
  loadPortal: function () {
    // First I try to load data as an admin, if I am not an admin, then I try to load data as a student
    var admin = false;
    Ajax.loadAdminPortal(
      function onSuccess(response) {
        // console.log("AdminPortal.js| Retrieved files: " + JSON.stringify(response, null, 2));
        this.setState({ files: response }, function () {
          admin = true;
            this.setState({ loaded: true, admin: true, modalIsOpen: false, });
        });
      }.bind(this),
      function onError(xhr, status, error) {
        Ajax.loadStudentPortal(
          function onSuccess(response) {
            this.setState({ files: response }, function () {
              this.setState({ loaded: true, admin: false, modalIsOpen: false });
            });
          }.bind(this),
          function onError(xhr, status, error) {
            console.log("error loading files");
          }.bind(this)
        )
      }.bind(this)
    )

    
  },
  setNewComment: function (event) {
    var comment = event.target.value;
    this.setState({ comment: comment });
  },
  setRattedApp: function(currentApp) {
    this.setState({ modalIsOpen: true, app: currentApp });
  },
  closeModal: function () {
    this.setState({ modalIsOpen: false, app: undefined });
  },
  submitComment: function () {
    if (typeof this.state.ratting === "undefined" || typeof this.state.comment === "undefined"){
      alert("You're so harsh. Give the app a fair rating, and comment.")
      return;
    }

    var submitMessage = "Are you sure you want to submit your commnet?\nOnce submitted, your comment can't be changed."
    if (!confirm(submitMessage)) {
        return;
    }

    Ajax.submitComment(
      this.state.app.id, this.state.ratting, this.state.comment,
      function onSuccess() {
        this.closeModal();
        window.location.reload(true);
      }.bind(this),
      function onError() {
        alert("Error submitting comment.");
      }.bind(this),
    );
  },
  setRatting: function(nextValue) {
    this.setState({ratting: nextValue});
  },
  renderApps: function() {
    var that = this;
    var apps = this.state.files.appsArray.map(function(app, i) {
      var appKey = "app-"+app.id;
      return (
        <AppContent key={appKey} app={app} index={i} admin={that.state.admin} openModal={that.setRattedApp.bind(that, app)}></AppContent>
      )
    });

    return apps;
  },
  componentDidMount: function () {
    this.loadPortal();
  },
  render: function () {

    return (
      <div>
        <ContentModule id="app-store-module" title="App store" initialHideContent={false}>
          <Modal isOpen={this.state.modalIsOpen} onCancel={this.closeModal} backdropClosesModal>
            <ModalHeader text="Rate this app" showCloseButton onClose={this.closeModal} />
            <ModalBody>
              <Form className="form" type="horizontal">
                <FormField label="Ratting">
                  <StarRatingComponent name="star-app-rating" starCount={5} value={0} onStarClick={this.setRatting}/>
                </FormField>

                <FormField label="Comments">
                  <FormInput multiline size="sm" placeholder="Your thoughts about this app" 
                  onChange={this.setNewComment}/>
                </FormField>

              </Form>
            </ModalBody>
            <ModalFooter>
              <Button type="danger" onClick={this.submitComment}>Submit</Button>
              <Button type="link-cancel" onClick={this.closeModal}>Cancel</Button>
            </ModalFooter>
          </Modal>
          <br />
          {this.state.loaded && this.renderApps()}
          <br />
        </ContentModule>
      </div>
    )
  }
})