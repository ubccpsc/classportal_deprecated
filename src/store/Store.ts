/**
 * Created by rtholmes on 2016-06-19.
 */

import Admin from '../model/Admin';
import Deliverable from '../model/Deliverable';
import Grade from '../model/Grade';
import Student from '../model/Student';
import Team from '../model/Team';

export interface Store {

    getAdmin(id:string):Admin;

    saveAdmin(admin:Admin):void;

    getStudent(id:string):Student;

    getStudents():Student[];

    /**
     * Add a new student to the store. If Student.getId() exists in store already it will be overwritten.
     *
     * @param student
     */
    saveStudent(student:Student):void;

    getTeam(teamId:string):Team;

    getTeams():Team[];

    saveTeam(team:Team):void;

    getDeliverable(deliverableId:string):Deliverable;

    getDeliverables():Deliverable[];

    saveDeliverable(deliverable:Deliverable):void;

    getGrades(student:Student):Grade[];

    /**
     * Add a new grade to the store. If a grade with the same student and deliverable already exists in store it will be overwritten.
     *
     * @param grade
     */
    saveGrade(grade:Grade):void;
}
export default Store;
