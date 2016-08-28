import React from 'react'
import { FileUpload, Form, FormRow, FormField, FormInput, FormIconField, FormSelect, Glyph, Button } from 'elemental'
import ContentModule from '../shared_components/ContentModule'
import Ajax from '../shared_components/Ajax'
import AdminStudents from './AdminStudents'

export default React.createClass({
  render: function () {
    return (
      <div>
        <AdminStudents />
        <UploadClassList />
      </div>
    )}
})

const UploadClassList = React.createClass({
  getInitialState: function () {
    return ({file: ''})
  },
  createProjects: function (e) {
    e.preventDefault();
  },
  handleChange: function (e) {
    this.setState({ file: e });
  },
  submitCSV: function (e) {
    e.preventDefault();
    console.log("Submitting..");
    
    //grab all form data  
    var formData = new FormData(this.state.file);
    console.log(formData);
    
    Ajax.submitClassList(
      formData,
      function success() {
        console.log("success");
      },
      function error() {
        console.log("error");
      }
    )
  },
  uploadFile: function () {
    console.log("upload");
  },
  render: function () {
    return (
      <ContentModule id="upload-classlist-module" title="Upload New Classlist" initialHideContent={false}>
        <Form onSubmit={this.submitCSV}>
          <FormField id="text-center">
            <input type="file" accept=".csv" id="inputCSV" onChange={this.handleChange} />
            <Button type="danger" size="sm" submit>Submit</Button>
          </FormField>
        </Form>
      </ContentModule>
    )}        
})