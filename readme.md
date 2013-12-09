The Node.js deploy client
=========================

Node.js commnd-line tool is designed to help you deploy your node.js application 

It is client side part of [node-deploy-server](https://github.com/AndyGrom/node-deploy-server)

Usages
------------
1. Install tool

	```bash
	npm install node-deploy-client -g
	```
2. Configuration  
	Create into root folder your project ".deploy" file with next content:
	
	```javascript
	{
		"url" : {
			"hostname" : "localhost",	// hostname node-deploy-server
			"port" : 15478,             // tcp port
			"username" : "admin",       // username. analog server-side username
            "password" : "admin"        // password. analog server-side password
		}
	}
	```
3. Run tool into root folder your project
	
	```bash
	node-deploy-client
	```

License
-------
MIT. See License.txt file.	
