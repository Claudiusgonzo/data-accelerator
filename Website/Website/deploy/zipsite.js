// *********************************************************************
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License
// *********************************************************************
// require modules
var fs = require('fs');
var path = require('path');
var archiver = require('archiver');

// create a file to stream archive data to.
var outputFile = __dirname + '/deployment.zip';
var output = fs.createWriteStream(outputFile);
var archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
});

// listen for all archive data to be written
// 'close' event is fired only when a file descriptor is involved
output.on('close', function() {
    console.log(`archiver has been finalized and the zipped file is at ${outputFile}, total bytes: ${archive.pointer()}.`);
});

// This event is fired when the data source is drained no matter what was the data source.
// It is not part of this library but rather from the NodeJS Stream API.
// @see: https://nodejs.org/api/stream.html#stream_event_end
output.on('end', function() {
    console.log('Data has been drained');
});

// good practice to catch warnings (ie stat failures and other non-blocking errors)
archive.on('warning', function(err) {
    if (err.code === 'ENOENT') {
        // log warning
        console.warn(err);
    } else {
        // throw error
        throw err;
    }
});

// good practice to catch this error explicitly
archive.on('error', function(err) {
    throw err;
});

// pipe archive data to the file
archive.pipe(output);

[
    // files
    'server.js',
    'appinsights.js',
    'host.js',
    'config.js',
    'auth.js',
    'logger.js',
    'securedSettings.js',
    'package.json',
    'web.composition.json',
    '.deployment',
    'web.config',
    'iisnode.yml',

    // folders with path ends with '/'
    'data/',
    'db/',
    'metrics/',
    'util/',

    //the following folders are generated by 'npm run build' on runtime
    'dist/prod/'
].forEach(path => {
    if (path.endsWith('/')) {
        archive.directory(path);
    } else {
        archive.file(path);
    }
});

// finalize the archive (ie we are done appending files but streams have to finish yet)
// 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
archive.finalize();