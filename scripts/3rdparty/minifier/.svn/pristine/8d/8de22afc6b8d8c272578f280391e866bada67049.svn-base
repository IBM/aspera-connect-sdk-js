#! /usr/bin/env node
/**
 * Tools for minifying based on 
 * HTMLMinifier v0.7.2 (http://kangax.github.io/html-minifier/)
 * Copyright 2010-2015 Juriy "kangax" Zaytsev
 * Licensed under MIT (https://github.com/kangax/html-minifier/blob/gh-pages/LICENSE)
 */

global.sys = require(/^v0\.[012]/.test(process.version) ? "sys" : "util");
var 
    fs = require("fs"),
    htmlMinify = require("./lib/html-minifier"),
    jsonMinify = require("./lib/json-minifier");

var options = {
    js_minify: false,
    css_minify: false,
    html_minify: false,
    json_minify: false,
    output: true
};

var args = Array.prototype.slice.call(process.argv, 2);
var filename;

out: while (args.length > 0) {
    var v = args.shift();
    switch (v) {
        case "--js":
            options.js_minify = true;
            break;
        case "--css":
            options.css_minify = true;
            break;
        case "--html":
            options.html_minify = true;
            break;
        case "--json":
            options.json_minify = true;
            break;
        case "--output":
            options.output = args.shift();
            break;
        default:
            filename = v;
            break out;
    }
}

if (filename) {
    fs.readFile(filename, "utf8", function(err, text){
        if (err) throw err;
        output(text);
    });
} else {
    var stdin = process.openStdin();
    stdin.setEncoding("utf8");
    var text = "";
    stdin.on("data", function(chunk){
        text += chunk;
    });
    stdin.on("end", function() {
        output(text);
    });
}

function output(text) {
    var out;
    if (options.output === true) {
            out = process.stdout;
    } else {
        out = fs.createWriteStream(options.output, {
            flags: "w",
            encoding: "utf8",
            mode: 0644
        });
    }
    text = processText(text);
    out.write(text);
    if (options.output !== true) {
        out.end();
    }
};

function processText(inputText) {
    var ret = "";
    try {
        if (options.json_minify) {
            ret = jsonMinify(inputText)
        }
        if (options.html_minify) {
            ret = htmlMinify.minify(inputText, 
            {
                removeComments: true,
                removeCommentsFromCDATA: true,
                collapseWhitespace: true,
                minifyCSS: true,
                minifyJS: true
            });
        }
        if (options.js_minify) {
            ret = htmlMinify.minify(inputText, 
            {
                removeComments: true,
                removeCommentsFromCDATA: true,
                collapseWhitespace: true,
                minifyJS: true
            });
        }
        if (options.css_minify) {
            ret = htmlMinify.minify(inputText, 
            {
                removeComments: true,
                removeCommentsFromCDATA: true,
                collapseWhitespace: true,
                minifyCSS: true,
            });
        }
    } catch(ex) {
        sys.debug(ex.stack);
        sys.debug(sys.inspect(ex));
        sys.debug(JSON.stringify(ex));
    }        
    return ret;
};
