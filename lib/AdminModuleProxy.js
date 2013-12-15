var http = require('http');
var fs = require('fs');
var path = require('path');

function Client(url) {
    this.url = url;
}

function response(request, res, cb){
    if (request.method == 'delete' || request.method == 'put') {
        if (res.statusCode === 200) {
            return cb(null);
        }
        return cb(res.statusCode);
    }

    var cookie = res.headers['set-cookie'];
    if (cookie) {
        cookie = cookie[0];
        request.headers['cookie'] = cookie;
    }

    var responseData = '';
    res.on('data', function(chunk){
        responseData += chunk.toString();
    });
    res.on('end', function(chunk){
        if (chunk) {
            responseData += chunk.toString();
        }
        if (res.statusCode === 200) {
            if (/application\/json/.test(res.headers['content-type'])){
                var result = JSON.parse(responseData);
                cb(null, result);
            } else {
                cb(null, responseData);
            }
        } else {
            cb(res.statusCode + ' :' + responseData);
        }
    });
}

Client.prototype.upload = function(filePath, callback){
    var fileName = path.basename(filePath);
    var boundaryKey = Math.random().toString(16); // random string
    var request = http.request(this.url, function(res){
        response(request, res, callback);
    });
    request.on('error', function(err){
        callback(err);
    });
    request.setHeader('Content-Type', 'multipart/form-data; boundary="'+boundaryKey+'"');
    request.write(
        '--' + boundaryKey + '\r\n'
            + 'Content-Type: application/octet-stream\r\n'
            + 'Content-Disposition: form-data; name="file"; filename="' + fileName + '"\r\n'
            + 'Content-Transfer-Encoding: binary\r\n\r\n'
    );
    fs.createReadStream(filePath, { bufferSize: 4 * 1024 })
        .on('end', function() {
            request.end('\r\n--' + boundaryKey + '--');
        })
        .pipe(request, { end: false }) // maybe write directly to the socket here?
};

module.exports = Client;

Client.prototype.deploy = function(name, data, callback){
    this.url.method = 'post';
    this.url.path = '/deploy/' + name;
    this.upload(data, callback);
};

