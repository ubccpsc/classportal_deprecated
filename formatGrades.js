#!/usr/bin / env node

/**
 * Script to format grades file for UBC ClassPortal.
 * Note that it should be executed in the folder where the grades file (grades.json) is.
 * To run: 'node formatGrades.js [filename]'
 */

const path = require('path');
const fs = require('fs');
const async = require('async');

// helper method for safely parsing JSON files.
function safelyParseJSON(json, callback) {
    try {
        var parsedJSON = JSON.parse(json);
        return callback(null, parsedJSON);
    } catch (error) {
        return callback(error, null);
    }
}

// helper method for reading and parsing JSON files.
function readJSON(filename, callback) {
    console.log("Reading file: " + filename);

    fs.readFile(filename, function (error, data) {
        if (error) {
            console.log("File read error!");
            return callback(true, null);
        } else {
            safelyParseJSON(data, function (error, parsedJSON) {
                if (!error) {
                    console.log("File read success.");
                    return callback(null, parsedJSON);
                } else {
                    console.log("Error parsing JSON.");
                    return callback(true, null);
                }
            });
        }
    });
}

function main() {
    // get filename from command line
    let fileName = process.argv[2];

    // read and parse JSON file specified from command line
    readJSON(fileName, function (error, gradesFile) {
        if (error) {
            console.log("Exiting..");
            process.exit(1);
        } else {
            console.log("Starting validation..");
            let newFile = [];
            // loop thru each entry in grades file
            async.forEachOf(gradesFile, function (entry, index, callback) {
                console.log("Checking entry " + index);
                let newEntry = {};

                async.waterfall([
                    /* Test 1: Check for sid property */
                    function copy_sid(cb) {
                        if (entry.hasOwnProperty("sid")) {
                            // console.log("Test 1 passed.");
                            newEntry.sid = entry.sid;
                            return cb();
                        } else {
                            console.log("Test 1 failed: property 'sid' does not exist on entry " + JSON.stringify(entry));
                            return cb("Error: No 'sid' property");
                        }
                    },
                    /* Test 2: Check for grades property to be array */
                    function copy_grades(cb) {
                        if (entry.hasOwnProperty("grades")) {
                            if (Object.prototype.toString.call(entry.grades) === '[object Array]') {
                                // console.log("Test 2 passed.");
                                newEntry.grades = entry.grades;
                            } else {
                                console.log("Test 2 failed: 'grades' is not an array. Overwriting with empty array..");
                                newEntry.grades = [];
                            }
                        } else {
                            console.log("Test 2 failed: property 'grades' does not exist.");
                            newEntry.grades = [];
                        }
                        return cb();
                    }
                ],
                    /* Push newEntry, which contains only 'sid' and 'grades' properties, to newFile */
                    function end_waterfall(err) {
                        if (!err) {
                            newFile.push(newEntry);
                            return callback();
                        } else {
                            console.log("Validation interrupted! " + err);
                            return callback(err);
                        }
                    }
                );
            },
                function end_for_each_of(err) {
                    if (err) {
                        console.log("Exiting..");
                        process.exit(1);
                    } else {
                        console.log("\nValidation and formatting successful! Copying the original file to: '" + fileName + ".copy'");
                        fs.writeFile(fileName + ".copy", JSON.stringify(gradesFile, null, 2), function (error) {
                            if (error) {
                                console.log("Write failed! Exiting..");
                                process.exit(1);
                            } else {
                                console.log("Copy success! Overwriting the original file..");
                                fs.writeFile(fileName, JSON.stringify(newFile, null, 2), function (error) {
                                    if (error) {
                                        console.log("Write failed! Exiting..");
                                        process.exit(1);
                                    } else {
                                        console.log("Write success! Exiting..");
                                        process.exit(0);
                                    }
                                });
                            }
                        });
                    }
                }
            );
        }
    });
}

main();