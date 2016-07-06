/**
 * Created by rtholmes on 2016-06-19.
 */

export default class Deliverable {

    public id:string;
    public name:string;
    public description:string;
    public url:string;
    public open:boolean; // could be a date instead
    public isTeam:boolean;
    public uploadKind:string; // null means no upload required, options: [null, 'pdf', 'zip']

    constructor(deliverableId:string, name:string, description:string, url:string, isTeam:boolean, open:boolean) {
        this.id = deliverableId;
        this.name = name;
        this.description = description;
        this.url = url;
        this.isTeam = isTeam;
        this.open = open;
        this.uploadKind = null;
    }

}
