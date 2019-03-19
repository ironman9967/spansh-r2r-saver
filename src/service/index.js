
import path from 'path'

import Hapi from 'hapi'
import Inert from 'inert'

import { get, map } from 'lodash/fp'

import FormData from 'form-data'
import fetch from 'node-fetch'

const server = Hapi.server({
	port: process.env.PORT || 8000,
	routes: {
		files: {
			relativeTo: path.resolve(__dirname, 'public')
		}
	}
})

/*
{
	radius,
	range,
	to,
	from,
	max_results,
	max_distance,
	min_value,
	use_mapping_value
}
*/

const spanshApiRoute = 'https://spansh.co.uk/api'

const getJobResults = ({ job }) => new Promise(resolve => setTimeout(() => {
	console.log(`calling for ${job} - ${Date.now()}`)
	fetch(`${spanshApiRoute}/results/${job}`).then(res => resolve(res.json()))
}, 10000))

const getRoute = ({ job }) => getJobResults({ job })
	.then(res => res.status == 'ok'
		? Promise.resolve(res.result)
		: getJobResults({ job }))
	.then(({ result }) => map(system => system)(result))
		
const view = ({ query }) => {
	const form = new FormData()
	Object.keys(query).forEach(k => form.append(k, query[k]))
	return fetch(`${spanshApiRoute}/riches/route`, {
		method: 'POST',
		body: form,
		headers: form.getHeaders()
	})
	.then(res => res.json())
	.then(getRoute)
}
		
const save = ({ name, query }) => view({ query })
	.then(console.log)

const api = {
	'r2r-route': {
		view,
		save
	}
}

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
		path: '/api/{route*}',
		handler: ({ params: { route }, query }, h) => {
			if (route) {
				const p = route.replace('/', '.')
				const m = get(p)(api)
				if (m) {
					return m({ query }).then(res => h.response(res))
				}
				else {
					console.log('ROUTE NOT FOUND!\n', m, p, api)
				}
			}
			else {
				console.log('ROUTE NOT FOUND 2!\n', route)
			}
			return h.response().code(404)
		}
	})
	
	return server.start()
})
.then(() => console.log('server up at:', server.info.uri))
