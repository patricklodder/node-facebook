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
		HTTPSCallWrapper('GET', graphHost, path, false, function(err, data){
			if (!err) {
				callback(false, querystring.parse(data).access_token);
			} else callback(err);
		});
	};
	
	this.graph = function(path, callback, accessToken, options) {
		var opts = {'access_token': accessToken};
		var qp = Facebook.BuildGet(path, opts);
		if (options == 'DELETE') {
			HTTPSCallWrapper('DELETE', graphHost, qp, false, callback);
		} else if (typeof(options) == 'object') {
			HTTPSCallWrapper('POST', graphHost, qp, options, callback);
		} else HTTPSCallWrapper('GET', graphHost, qp, false, callback);
	};
	
}

Facebook.BuildGet = function (path, params) {
	return path + '?' + querystring.stringify(params);
};

function HTTPSCallWrapper(method, host, path, postData, callback) {
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

module.exports = Facebook;