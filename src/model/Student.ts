/**
 * Created by rtholmes on 2016-06-19.
 */

//module portal {
export default class Student {

    /**
     * This can be whatever you want but should never be updated during the term.
     *
     * 310: we will use CS lab id
     */
    public id:string;
    public name:string;
    public studentNumber:number;

    /**
     * Alternate id. Optional.
     *
     * 310: we will use Github id
     */
    private altId:string;

    constructor(id:string, name:string, studentNumber:number, altId?:string) {
        this.id = id;
        this.name = name;
        this.studentNumber = studentNumber;
        if (altId) {
            this.altId = altId;
        } else {
            this.altId = null;
        }
        //this.team = null;
    }

    /*
     setTeam(team:Team):void {
     this.team = team;
     }

     getTeam():Team {
     return this.team;
     }
     */
    /*
        getName():string {
            return this.name;
        }

        getAltId():string {
            return this.altId;
        }

        getId():string {
            return this.id;
        }
        */
}
// }