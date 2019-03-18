
import path from 'path'

import Hapi from 'hapi'
import Inert from 'inert'

const server = Hapi.server({
	port: process.env.PORT || 8000,
	routes: {
		files: {
			relativeTo: path.resolve(__dirname, 'public')
		}
	}
})

server.register(Inert)
.then(() => {
	
	server.route({
		method: 'GET',
		path: '/{param*}',
		handler: {
			directory: {
				path: '.',
				redirectToSlash: true,
				index: true,
			}
		}
	})
	
	server.route({
		method: 'GET',
		path: '/hello',
		handler: (req, h) => h.response('ok')
	})
	
	return server.start()
})
.then(() => console.log('server up at:', server.info.uri))
