
import path from 'path'

import Hapi from 'hapi'
import Inert from 'inert'

import { get } from 'lodash/fp'

import FormData from 'form-data'
import fetch from 'node-fetch'

import redis from 'redis'

const server = Hapi.server({
	port: 8000, //process.env.PORT || 8000,
	routes: {
		files: {
			relativeTo: path.resolve(__dirname, 'public')
		}
	}
})

const spanshApiRoute = 'https://spansh.co.uk/api'
const redisGlobalPrepend = 'spansh-r2r-saver'

const getRoute = ({ job }) => new Promise(resolve => 
	setTimeout(() => fetch(`${spanshApiRoute}/results/${job}`)
		.then(res => res.json())
		.then(({ status, result }) => resolve(status == 'queued'
			? getRoute({ job })
			: result))
	, 50)
)

const convertNameToId = ({ name }) => name.replace(/ /g, '#').replace(/\./g, '$')

const getRedisClient = opts => new Promise(resolve => {
	const rc = redis.createClient(opts)
	rc.once('ready', () => resolve(rc))
})

const addToSetWithClient = ({ rc }) => ({
	key,
	value
}) => new Promise((resolve, reject) => rc.sadd(key, value, (err, reply) => err
	? reject(err)
	: resolve(reply)))

const setStringWithClient = ({ rc }) => ({
	key,
	value
}) => new Promise((resolve, reject) => rc.set(key, value, (err, reply) => err
	? reject(err)
	: resolve(reply)))
	
const getSetMemebersWithClient = ({ rc }) => ({ 
	key 
}) => new Promise((resolve, reject) => rc.smembers(key, (err, reply) => err
	? reject(err)
	: resolve(reply)))

const getStringWithClient = ({ rc }) => ({
	key
}) => new Promise((resolve, reject) => rc.get(key, (err, reply) => err
	? reject(err)
	: resolve(reply)))
	
const removeFromSetWithClient = ({ rc }) => ({
	key,
	value
}) => new Promise((resolve, reject) => rc.srem(key, value, (err, reply) => err
	? reject(err)
	: resolve(reply)))
	
const keysWithClient = ({ rc }) => ({
	search
}) => new Promise((resolve, reject) => rc.keys(search, (err, reply) => err
	? reject(err)
	: resolve(reply)))
	
const delKeyWithClient = ({ rc }) => ({
	key
}) => new Promise((resolve, reject) => rc.del(key, (err, reply) => err
	? reject(err)
	: resolve(reply)))
		
const fetchDataFromSpansh = ({ settings }) => {
	const form = new FormData()
	Object.keys(settings).forEach(k => form.append(k, settings[k]))
	return fetch(`${spanshApiRoute}/riches/route`, {
		method: 'POST',
		body: form,
		headers: form.getHeaders()
	})
	.then(res => res.json())
	.then(getRoute)
	.then(route => {
		const { name: origin } = route.shift()
		const { name: destination } = route.pop()
		return {
			created: Date.now(),
			origin,
			destination,
			settings,
			systems: route.map(({ bodies, name, ...system }) => ({
				id: convertNameToId({ name }),
				name,
				...system,
				bodies: bodies.map(({ id, name, ...body }) => ({
					id: convertNameToId({ name }),
					name,
					complete: false,
					...body
				}))
			}))
		}
	})
}
		
const save = ({ query: { name, ...settings } }) => {
	if (name) {
		return fetchDataFromSpansh({ settings })
		.then(rawRoute => new Promise(resolve => {
			const route = {
				id: convertNameToId({ name }),
				name,
				...rawRoute
			}
			getRedisClient()
			.then(rc => {
				const addToSet = addToSetWithClient({ rc })
				const setString = setStringWithClient({ rc })
				addToSet({
					key: `${redisGlobalPrepend}.routes`,
					value: route.id
				})
				.then(() => Promise.all(Object.keys(route).reduce((promises, k) => {
					if (![
						'systems',
						'settings'
					].includes(k)) {
						promises.push(setString({
							key: `${redisGlobalPrepend}.route.${route.id}.${k}`,
							value: route[k]
						}))
					}
					return promises
				}, [])))
				.then(() => Promise.all(Object.keys(route.settings).map(k => 
					setString({
						key: `${redisGlobalPrepend}.route.${route.id}.setting.${k}`,
						value: route.settings[k]
					})
				)))
				.then(() => Promise.all(route.systems.map(system => 
					addToSet({
						key: `${redisGlobalPrepend}.route.${route.id}.systems`,
						value: system.id
					})
					.then(() => setString({
						key: `${redisGlobalPrepend}.route.${route.id}.system.${system.id}.name`,
						value: system.name
					}))
					.then(() => setString({
						key: `${redisGlobalPrepend}.route.${route.id}.system.${system.id}.jumps`,
						value: system.jumps
					}))
					.then(() => Promise.all(system.bodies.map(body => 
						addToSet({
							key: `${redisGlobalPrepend}.route.${route.id}.system.${system.id}.bodies`,
							value: body.id
						})
						.then(() => Promise.all(Object.keys(body).map(k =>
							setString({
								key: `${redisGlobalPrepend}.route.${route.id}.system.${system.id}.body.${body.id}.${k}`,
								value: body[k]
							})
						)))
					)))
				)))
				.then(() => {
					rc.quit()
					resolve(route)
				})
			})
		}))
	}
	return Promise.resolve({ error: 'name is required' })
}
		
const routes = () => getRedisClient()
.then(rc => {
	const getSetMembers = getSetMemebersWithClient({ rc })
	const getString = getStringWithClient({ rc })
	return getSetMembers({ key: `${redisGlobalPrepend}.routes` })
	.then(routes => Promise.all(routes.map(routeId => getString({
		key: `${redisGlobalPrepend}.route.${routeId}.name`
	}))))
	.then(routes => {
		rc.quit()
		return routes
	})
})
		
const route = ({ query: { name } }) => {
	if (name) {
		return getRedisClient()
		.then(rc => {
			const routeId = convertNameToId({ name })
			const getSetMembers = getSetMemebersWithClient({ rc })
			const getString = getStringWithClient({ rc })
			return Promise.all([
				'name',
				'created',
				'origin',
				'destination'
			].map(k => getString({
				key: `${redisGlobalPrepend}.route.${routeId}.${k}`
			})))
			.then(([
				name,
				created,
				origin,
				destination
			]) => ({
				id: routeId,
				name,
				created,
				origin,
				destination
			}))
			.then(route => Promise.all([
					'radius',
					'range',
					'to',
					'from',
					'max_results',
					'max_distance',
					'min_value',
					'use_mapping_value'
				].map(k => getString({
					key: `${redisGlobalPrepend}.route.${routeId}.setting.${k}`
				})))
				.then(([
					radius,
					range,
					to,
					from,
					max_results,
					max_distance,
					min_value,
					use_mapping_value
				]) => ({
					...route,
					settings: {
						radius,
						range,
						to: to ? to : from,
						from,
						max_results,
						max_distance,
						min_value,
						use_mapping_value
					}
				}))
			)
			.then(route => getSetMembers({
					key: `${redisGlobalPrepend}.route.${routeId}.systems`
				})
				.then(systems => Promise.all(systems.map(systemId => Promise.all([
						'name',
						'jumps'
					].map(k => getString({
						key: `${redisGlobalPrepend}.route.${routeId}.system.${systemId}.${k}`
					})))
					.then(([
						name,
						jumps
					]) => ({
						id: systemId,
						name,
						jumps
					}))
					.then(system => getSetMembers({
							key: `${redisGlobalPrepend}.route.${routeId}.system.${systemId}.bodies`
						})
						.then(bodies => Promise.all(bodies.map(bodyId => Promise.all([
							'name',
							'complete',
							'distance_to_arrival',
							'estimated_mapping_value',
							'estimated_scan_value',
							'is_terraformable',
							'subtype',
							'type'
						].map(k => getString({
							key: `${redisGlobalPrepend}.route.${routeId}.system.${systemId}.body.${bodyId}.${k}`
						})))
						.then(([
							name,
							complete,
							distance_to_arrival,
							estimated_mapping_value,
							estimated_scan_value,
							is_terraformable,
							subtype,
							type
						]) => ({
							id: bodyId,
							name,
							complete,
							distance_to_arrival,
							estimated_mapping_value,
							estimated_scan_value,
							is_terraformable,
							subtype,
							type
						}))))
						.then(bodies => ({
							...system,
							bodies
						})))
					)))
					.then(systems => ({
						...route,
						systems
					}))
			))
			.then(route => {
				rc.quit()
				return route
			})
		})
	}
	return Promise.resolve({ error: 'name is required' })
}

const setBodyComplete = ({ 
	query: { 
		routeName, 
		systemName, 
		bodyName, 
		complete
	}
}) => getRedisClient()
	.then(rc => {
		const routeId = convertNameToId({ name: routeName })
		const systemId = convertNameToId({ name: systemName })
		const bodyId = convertNameToId({ name: bodyName })
		const setString = setStringWithClient({ rc })
		return setString({
			key: `${redisGlobalPrepend}.route.${routeId}.system.${systemId}.body.${bodyId}.complete`,
			value: complete === 'true'
		}).then(res => ({ res }))
	})

const deleteRoute = ({ query: { name } }) => {
	if (name) {
		return getRedisClient()
		.then(rc => {
			const routeId = convertNameToId({ name })
			const removeFromSet = removeFromSetWithClient({ rc })
			const keys = keysWithClient({ rc })
			const delKey = delKeyWithClient({ rc })
			return removeFromSet({
				key: `${redisGlobalPrepend}.routes`,
				value: routeId
			})
			.then(() => keys({
				search: `${redisGlobalPrepend}.route.${routeId}.*`
			}))
			.then(keys => Promise.all(keys.map(key => delKey({
				key
			}))))
			.then(() => { rc.quit() })
		})
	}
	return Promise.resolve({ error: 'name is required' })
}

const api = {
	'r2r-route': {
		save,
		routes,
		route,
		'delete-route': deleteRoute,
		'set-body-complete': setBodyComplete
	}
}

server.register(Inert).then(() => {
	
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
				const p = route.replace(/\//g, '.')
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
}).then(() => console.log('server up at:', server.info.uri))
