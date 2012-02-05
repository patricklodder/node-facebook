var crypto = require('crypto');
var https = require('https');
var querystring = require('querystring');

// 'statics'
var graphHost = 'graph.facebook.com';
var authTokenPath = '/oauth/access_token';

function Facebook(appId, appSecret, callbackUrl) {
	this.appId = appId;
	this.callbackUrl = callbackUrl;
	
	this.authToken = false;
	
	var secret = appSecret;
	
	this.getAuthToken = function (code, callback) {
		var path = Facebook.BuildGet(authTokenPath, {'client_id': this.appId, 'client_secret': secret, 'redirect_uri': this.callbackUrl, 'code': code});
		HTTPSWrapper(graphHost, path, function(err, data){
			if (!err) {
				console.log('GOT DATA:' + data);
				callback(false, querystring.parse(data).access_token);
			} else callback(err);
		});
	};
	
	this.graph = function(path, callback, accessToken, options) {
		var opts = {'access_token': accessToken};
		var qp = Facebook.BuildGet(path, opts);
		if (options == 'DELETE') {
			HTTPSDeleteWrapper(graphHost, qp, callback);
		} else if (typeof(options) == 'object') {
			HTTPSPostWrapper(graphHost, qp, options, callback);
		} else HTTPSWrapper(graphHost, qp, callback);
	};
	
}

Facebook.Base64UrlDecode = function (str) {
	return new Buffer(str.replace(/-/g, '+').replace(/_/g,'/'), 'base64').toString('binary');
};

Facebook.BuildGet = function (path, params) {
	return path + '?' + querystring.stringify(params);
};

function HTTPSWrapper(host, path, callback) {
	console.log('GETTING from https://' + host + path);
	https.get({'host': host, 'path': path, 'headers': {'Expect': ''}}, function(response) {
		console.log('Got response: ' + JSON.stringify(response.headers));
		if (response.statusCode == 200) {
			var buffer = '';
			response.on('data', function(data){
				buffer += data;
				console.log('RECEIVED: ' + data);
			});
			response.on('end', function(){callback(false, buffer);});
		} else callback('Wrong status code returned: ' + response.statusCode + ", headers: " + JSON.stringify(response.headers)); 
	}).on('error', function(e) {callback('Error GETTING from https://' + host);});
}

function HTTPSCallWrapper(method, host, path, postData, callback) {
	console.log('Executing ' + method, ' ' + JSON.stringify(postData) + ' to https://' + host + path);
	var req = https.request({'host': host, 'path': path, 'method': method}, function(res){
		if (res.statusCode == 200) {
			var buffer = '';
			res.on('data', function(data){buffer += data;});
			res.on('end', function(){callback(false, buffer);});
		}
	});
	if (postData) req.write(querystring.stringify(postData));
	req.end();
}

function HTTPSPostWrapper(host, path, postData, callback) {
	HTTPSCallWrapper('POST', host, path, postData, callback);	
}

function HTTPSDeleteWrapper(host, path, callback) {
	HTTPSCallWrapper('DELETE', host, path, false, callback);	
}

module.exports = Facebook;