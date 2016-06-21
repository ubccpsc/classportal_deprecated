/**
 * Created by rtholmes on 2016-06-20.
 */

/**
 * Grab bag of methods that probably shouldn't be in the default namespace.
 *
 * @param msg
 */
export default class Log {

    public static trace(msg:string) {
        console.log("<T> " + new Date().toLocaleString() + ": " + msg);
    }

    public static info(msg:string) {
        console.log("<I> " + new Date().toLocaleString() + ": " + msg);
    }

    public static warn(msg:string) {
        console.error("<W> " + new Date().toLocaleString() + ": " + msg);
    }

    public static error(msg:string) {
        console.error("<E> " + new Date().toLocaleString() + ": " + msg);
    }

    public static test(msg:string) {
        console.error("<TEST> " + new Date().toLocaleString() + ": " + msg);
    }

}

