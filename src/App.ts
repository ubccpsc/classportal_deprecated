/**
 * Created by rtholmes on 2016-06-19.
 */

import Log from './Util';
import Server from './rest/Server';
var config = require('../config.json');

export class App {

    initServer(port: number) {
        Log.info('App::initServer( ' + port + ' ) - start');
        let s = new Server(port);
        s.start();
    }
}


// catch the uncaught errors that weren't wrapped in a domain or try catch statement
// do not use this in modules, but only in applications, as otherwise we could have multiple of these bound
process.on('uncaughtException', function (err: any) {
    // at least report the error before crashing
    Log.error('App::Uncaught Exception: ' + err);
});



Log.info('App - starting');
let app = new App();
app.initServer(config.port);