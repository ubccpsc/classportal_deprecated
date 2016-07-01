/**
 * Created by rtholmes on 2016-06-19.
 */


/**
 * This is the same for student and team deliverables. If a grade is set on a student for a team deliverable the grade should be set for all students in the team.
 */

import Deliverable from './Deliverable';
import Student from './Student';

export default class Grade {

    // id is implicit: <student,deliverable> is a unique tuple

    public student:Student;
    public deliverable:Deliverable;
    public value:number;

    constructor(student:Student, deliverable:Deliverable, value:number) {
        this.student = student;
        this.deliverable = deliverable;
        this.value = value;
    }

}
