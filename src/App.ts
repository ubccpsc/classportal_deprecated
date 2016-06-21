/**
 * Created by rtholmes on 2016-06-19.
 */

import Log from './Util';
import Server from './rest/Server';

namespace portal {
    export class App {

        initServer(port:number) {
            Log.info('App::initServer( ' + port + ' ) - start');
            let s = new Server(port);
        }
    }
}

Log.info('App - starting');
let app = new portal.App();
app.initServer(4321);
