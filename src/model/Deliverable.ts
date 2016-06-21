/**
 * Created by rtholmes on 2016-06-19.
 */

// module portal {
export default class Deliverable {

    public id:string;
    public name:string;
    public description:string;
    public url:string;
    public open:boolean;
    public isTeam:boolean

    constructor(deliverableId:string, name:string, description:string, url:string, isTeam:boolean, open:boolean) {
        this.id = deliverableId;
        this.name = name;
        this.description = description;
        this.url = url;
        this.isTeam = isTeam;
        this.open = open;
    }

}
//}