/**
 * Created by rtholmes on 2016-06-19.
 */

import Log from "../Util";

export default class EchoController {

    public static echo(value:string):string {
        Log.trace('EchoController::echo( ' + value + ' )');
        return value + '...' + value;
    }
}
