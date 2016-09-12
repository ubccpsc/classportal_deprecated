import React from 'react'
import { FileUpload, Form, FormRow, FormField, FormInput, FormIconField, FormSelect, Glyph, Button } from 'elemental'
import ContentModule from '../../shared_components/ContentModule'
import Ajax from '../../shared_components/Ajax'
import AdminStudents from './AdminStudents'
import UploadClasslist from './UploadClasslist'

export default React.createClass({
  render: function () {
    return (
      <div>
        <AdminStudents students={this.props.files.studentsFile} myTeams={this.props.files.adminsFile[this.props.files.myAdminIndex].teams} />
        {this.props.files.adminsFile[this.props.files.myAdminIndex].prof === true && (<UploadClasslist/>) }
      </div>
    )
  }
})