/**
 * Created by rtholmes on 2016-06-19.
 */

// import Deliverable from './Deliverable';
//import Grade from './Grade';
import Student from './Student';
//import Team from './Team';

//module portal {
export default class Team {

    public id:string;
    public name:string;
    public members:Student[] = [];

    constructor(id:string, name:string, members:Student[]) {
        this.id = id;
        this.name = name;
        this.members = members;
    }

    /*
    getName():string {
        return this.name;
    }

    getMembers():Student[] {
        return this.members;
    }

    getId():string {
        return this.id;
    }
    */

}
//}


