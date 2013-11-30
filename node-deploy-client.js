var fs = require('fs');
var path = require('path');
var Client = require('./AdminModuleProxy');
var argv = require('optimist').argv;
var tmp = require('tmp');
var targz = require('./targz/targz');

var deploySettings = path.join(process.cwd(), '.deploy');
var packagePath = path.join(process.cwd(), 'package.json');
var package;

fs.readFile(deploySettings, function(err, data) {
    if (err) {
        return console.dir(err);
    }

    try {
        var hosting = JSON.parse(data);
    } catch(err) {
        return console.dir(err);
    }

    fs.readFile(packagePath, function (err, data) {
        if (err) {
            return console.dir(err);
        }

        try {
            package = JSON.parse(data);

            if (!hosting.exclude) {
                hosting.exclude = [];
            }
            var admin = new Client(hosting.url);
            deploy(admin, hosting);

        } catch (err) {
            return console.dir(err);
        }
    });

});

function check(err){
    if (err){
        console.log('ERROR:');
        console.dir(err);
        throw err;
    }
}

function deploy(admin, hosting){
    return packAndDeploy(admin, hosting);
}

function packAndDeploy(admin, hosting){
    console.log('pack...');
    hosting.exclude = hosting.exclude.concat(path.join(process.cwd(), "node_modules"));

    for(var i = 0; i < hosting.exclude.length; i++){
        hosting.exclude[i] = path.resolve(hosting.exclude[i]);
    }
    copyToTemporary(path.resolve('./'), hosting.exclude, function(err, path){
        check(err);
        packApplication(path, package.name, function(err, fileName){
            check(err);
            console.log('deploy...');
            admin.deploy(package.name, fileName, function(err, data){
                fs.unlink(fileName);
                check(err);
                console.log(data);
            });
        });
    });
}

function packApplication(folder, appName, callback){
    tmp.file(function(err, tempFile){
        targz.create(folder, tempFile, function(err){
            callback(err, tempFile);
        });
    });
}

function copyToTemporary(storagePath, exclude, callback){
    tmp.dir(function(err, path){
        check(err);
        copyFolder(storagePath, path, exclude);
        callback(null, path);
    });
}

function copyFolder(src, dst, exclude) {
    var files = fs.readdirSync(src);
    if( files && files.length ) {
        for(var i = 0; i < files.length; i++){
            var file = files[i];
            var srcFile = path.join(src, file);
            var dstFile = path.join(dst, file);
            var fileStat = fs.statSync(srcFile);
            if (fileStat.isDirectory()) {
                if (!excluded(srcFile, exclude)) {
                    fs.mkdirSync(dstFile);
                    copyFolder(srcFile, dstFile, exclude);
                }
            } else {
                if (!excluded(srcFile, exclude)) {
                    var buffer = fs.readFileSync(srcFile);
                    fs.writeFileSync(dstFile, buffer);
                }
            }
        }
    }
}

function excluded(file, exclude) {
    for(var i = 0; i < exclude.length; i++) {
        if (file === exclude[i]) {
            return true;
        }
    }
    return false;
}

