import "node:path" as Path;
import "node:fs" as FS;

import inspect from "node:util";
import parseScript from "../src/es6parse.js";

var HOP = {}.hasOwnProperty,
    TEST_COMMENT = /\/\*\*!?[\s\S]+?\*\*\//g,
    COMMENT_TRIM = /^\/\*\*!?|\*\*\/$/g;

var SKIP_KEYS = {

    "start": 1,
    "end": 1,
    "newlineBefore": 1,
    "message": 1,
    "directive": 1,
    "context": 1
}

var testCount = 0;

// Returns true if the argument is an object
function isObject(obj) {

    return obj && typeof obj === "object";
}

// Returns true if the specified AST is "like" another AST
function astLike(a, b) {

    if (a === b)
        return true;
        
    if (!isObject(a) || !isObject(b))
		return a === b;
	
	var keys, i;
	
	// Each key in control must be in test
	for (keys = Object.keys(b), i = 0; i < keys.length; ++i)
	    if (!HOP.call(a, keys[i]))
	        return false;
	
	for (keys = Object.keys(a), i = 0; i < keys.length; ++i) {
	
		// Control must have same own property
		if (!HOP.call(b, keys[i])) {
		
		    if (SKIP_KEYS[keys[i]] === 1) continue;
		    else return false;
		}
		
		// Values of own properties must be equal
		if (!astLike(a[keys[i]], b[keys[i]]))
			return false;
	}
	
	return true;
}

function astLikeFail(msg) {

    console.log(msg);
    return false;
}

// Returns the group name for a test file
function groupName(path) {

    path = Path.dirname(path);
    
    if (path.indexOf(__dirname) === 0)
        path = path.slice(__dirname.length);
    
    return path.replace(/[\/\\]/g, ".").replace(/^\./, "");
}

// Returns a stat object for a path
function statPath(path) {

    try { return FS.statSync(path); } catch (ex) {}
    return null;
}

// Executes a function for each file in a directory
function walkDirectory(dir, fn) {

    FS
    .readdirSync(dir)
    .filter(name => name.charAt(0) !== ".")
    .map(name => Path.resolve(dir, name))
    .map(path => ({ path: path, stat: statPath(path) }))
    .forEach(entry => {
    
        if (!entry.stat)
            return;
        
        if (entry.stat.isDirectory())
            return walkDirectory(entry.path, fn);
        
        if (entry.stat.isFile())
            fn(entry.path);
    });
}

module Style {

    export function green(msg) {
    
        return `\x1B[32m${ msg }\x1B[39m`;
    }
    
    export function red(msg) {
    
        return `\x1B[31m${ msg }\x1B[39m`;
    }
    
    export function gray(msg) {
    
        return `\x1B[90m${ msg }\x1B[39m`;
    }
    
    export function bold(msg) {
    
        return `\x1B[1m${ msg }\x1B[22m`;
    }
}

// Prints an application message to the console
function printMessage(msg) {

    console.log(Style.gray(msg));
}

// Prints a group header to the console
function printHeader(msg) {

    console.log(`\n${ Style.bold("== " + msg + " ==") }\n`);
}

// Prints a test result
function printResult(msg, pass) {

    console.log(msg + " " + (pass ? Style.green("OK") : Style.bold(Style.red("FAIL"))));
}

// Read a javascript or json file
function readFile(filename) {

    var text = FS.readFileSync(filename, "utf8");
    
    // From node/lib/module.js/Module.prototype._compile
    text = text.replace(/^\#\!.*/, '');
    
    // From node/lib/module.js/stripBOM
    if (text.charCodeAt(0) === 0xFEFF)
        text = text.slice(1);
    
    return text;
}

// Parses a list of test inputs from comments
function parseTestComments(text) {

    var list = text.match(TEST_COMMENT) || [];
    
    return list.map(source => source.replace(COMMENT_TRIM, "").trim());
}

// Displays an object tree
function displayTree(tree) {

    console.log(inspect(tree, false, 10, true));
}

function run() {

    var currentGroup = null;
    
    printMessage("\nStarting es6parse tests...");
    
    walkDirectory(__dirname, path => {
    
        var group = groupName(path),
            name = Path.basename(path, ".js"),
            tree;
        
        // Only javascript files in nested directories
        if (!group || Path.extname(path) !== ".js")
            return;
        
        // Print a group header
        if (group !== currentGroup)
            printHeader(currentGroup = group);
        
        var text = readFile(path),
            programs = parseTestComments(text),
            outputs = (new Function("return " + text))(),
            keys = Object.keys(outputs),
            pass,
            i;
        
        for (i = 0; i < programs.length; ++i) {
        
            try { 
            
                tree = parseScript(programs[i]);
            
            } catch (err) {
                
                if (err instanceof SyntaxError)
                    tree = { message: err.message };
                else
                    throw err;
            }
            
            pass = astLike(tree, outputs[keys[i]]);
            
            testCount++;
            printResult(name + " - " + keys[i], pass);
            
            if (!pass) {
        
                printMessage("\nGenerated tree:\n");
                displayTree(tree);
                throw "stop";
            }
        }
    });
}

try { 

    run();
    printMessage("\nSuccessfully completed " + testCount + " tests - looks good to me!");

} catch (err) { 

    if (err !== "stop") {
    
        printMessage("\nSnap! An error has occurred.");
        throw err;
    }
    
} finally {

    console.log("");
}

