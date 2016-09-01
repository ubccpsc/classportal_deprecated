import React from 'react'
import { FileUpload, Form, FormRow, FormField, FormInput, FormIconField, FormSelect, Glyph, Button } from 'elemental'
import ContentModule from '../../shared_components/ContentModule'
import Ajax from '../../shared_components/Ajax'
import AdminStudents from './AdminStudents'
import UploadClassList from './UploadClassList'

export default React.createClass({
  render: function () {
    return (
      <div>
        <AdminStudents students={this.props.students} myTeams={this.props.admin.teams} />
        <UploadClassList />
      </div>
    )}
})