/**
 * Created by rtholmes on 2016-06-19.
 */


// import Deliverable from './Team';
//import Grade from './Grade';
// import Student from './Student';
import Team from './Team';

//module portal {
export default class Admin {

    /**
     * Can be anything.
     *
     * 310: we will use github id
     */
    private id:string;
    private name:string;


    /**
     * The teams the admin is responsible for. More than one Admin can be responsible for the same team. If this is empty, the admin is responsible for all teams.
     *
     * @type {Array}
     */
    private teams:Team[] = [];

    constructor(id:string, name:string, teams:Team[]) {
        this.id = id;
        this.name = name;
        if (teams === null) {
            teams = [];
        }
        this.teams = teams;
    }

    getTeams():Team[] {
        return this.teams;
    }

    getName():string {
        return this.name;
    }

    getId():string {
        return this.id;
    }
}
//}