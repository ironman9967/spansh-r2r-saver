
import path from 'path'

import Hapi from 'hapi'
import Inert from 'inert'

import SocketIO from 'socket.io'

import { get } from 'lodash/fp'

import FormData from 'form-data'
import fetch from 'node-fetch'

import redis from 'redis'

const [ ,, port ] = process.argv

const server = Hapi.server({
	port: port || process.env.PORT || 8000,
	routes: {
		files: {
			relativeTo: path.resolve(__dirname, 'public')
		}
	}
})
	
const io = SocketIO.listen(server.listener)

const spanshApiRoute = 'https://spansh.co.uk/api'
const redisGlobalPrepend = 'spansh-r2r-saver'

const getRoute = ({ job }) => new Promise(resolve => setTimeout(resolve, 50))
	.then(() => fetch(`${spanshApiRoute}/results/${job}`))
	.then(res => res.json())
	.then(({ status, result, error }) => {
		if (error) {
			return Promise.reject(new Error(error))
		}
		if (status == 'queued') {
			return getRoute({ job })
		}
		return result
	})

const convertNameToId = ({ name }) => name.replace(/ /g, '#').replace(/\./g, '$')

const getRedisClient = opts => new Promise(resolve => {
	const rc = redis.createClient(opts)
	rc.once('ready', () => resolve(rc))
})

const addToSortedSetWithClient = ({ rc }) => ({
	key,
	score,
	value
}) => new Promise((resolve, reject) => rc.zadd(key, score, value, (err, reply) => err
	? reject(err)
	: resolve(reply)))
	
const lengthOfSortedSetWithClient = ({ rc }) => ({
	key
}) => new Promise((resolve, reject) => rc.zcount(key, '-inf', '+inf', (err, reply) => err
	? reject(err)
	: resolve(reply)))

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

const incrementByWithClient = ({ rc }) => ({
	key,
	value
}) => new Promise((resolve, reject) => rc.incrby(key, value, (err, reply) => err
	? reject(err)
	: resolve(reply)))

const decrementByWithClient = ({ rc }) => ({
	key,
	value
}) => new Promise((resolve, reject) => rc.decrby(key, value, (err, reply) => err
	? reject(err)
	: resolve(reply)))
	
const getSetMemebersWithClient = ({ rc }) => ({ 
	key 
}) => new Promise((resolve, reject) => rc.smembers(key, (err, reply) => err
	? reject(err)
	: resolve(reply)))
	
const getSortedSetRangeWithClient = ({ rc }) => ({ 
	key,
	start = 0,
	stop = -1
}) => new Promise((resolve, reject) => rc.zrange(key, start, stop, (err, reply) => err
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
	pattern
}) => new Promise((resolve, reject) => rc.keys(pattern, (err, reply) => err
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
		let sysCounter = 0
		return {
			created: Date.now(),
			origin,
			destination,
			settings,
			systemCount: route.length,
			systems: route.map(({ bodies, name, ...system }) => {
				let bodyCounter = 0
				return {
					id: convertNameToId({ name }),
					order: sysCounter++,
					name,
					...system,
					bodies: bodies.map(({ id, name: fullBodyName, ...body }) => {
						const bodyName = fullBodyName.replace(name, '')
						return {
							id: convertNameToId({ name: bodyName }),
							order: bodyCounter++,
							name: bodyName,
							complete: false,
							...body
						}
					})
				}
			})
		}
	})
}
		
const save = ({ query: { name, ...settings } }) => {
	if (name) {
		return fetchDataFromSpansh({ settings })
		.then(rawRoute => {
			const route = {
				id: convertNameToId({ name }),
				name,
				...rawRoute
			}
			route.stats = route.systems.reduce((stats, s) => {
				stats.total_jumps += parseInt(s.jumps)
				stats.total_bodies += s.bodies.length
				stats.total_credits += s.bodies.reduce((total_credits, b) =>
					total_credits + (settings.use_mapping_value
						? parseInt(b.estimated_mapping_value)
						: parseInt(b.estimated_scan_value))
				, 0)
				return stats
			}, {
				total_credits: 0,
				total_jumps: 0,
				total_bodies: 0,
				completed_bodies: 0
			})
			return getRedisClient()
			.then(rc => {
				const addToSortedSet = addToSortedSetWithClient({ rc })
				const addToSet = addToSetWithClient({ rc })
				const setString = setStringWithClient({ rc })
				const incrementBy = incrementByWithClient({ rc })
				return addToSet({
					key: `${redisGlobalPrepend}.routes`,
					value: route.id
				})
				.then(() => Promise.all(Object.keys(route).reduce((promises, k) => {
					if (![
						'systems',
						'settings',
						'stats'
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
				.then(() => Promise.all(Object.keys(route.stats).map(k => incrementBy({
					key: `${redisGlobalPrepend}.route.${route.id}.stats.${k}`,
					value: route.stats[k]
				}))))
				.then(() => Promise.all(route.systems.map(system => 
					addToSortedSet({
						key: `${redisGlobalPrepend}.route.${route.id}.systems`,
						score: system.order,
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
					.then(() => setString({
						key: `${redisGlobalPrepend}.route.${route.id}.system.${system.id}.order`,
						value: system.order
					}))
					.then(() => Promise.all(system.bodies.map(body => 
						addToSortedSet({
							key: `${redisGlobalPrepend}.route.${route.id}.system.${system.id}.bodies`,
							score: body.order,
							value: body.id
						})
						.then(() => Promise.all(Object.keys(body).map(k =>
							setString({
								key: `${redisGlobalPrepend}.route.${route.id}.system.${system.id}.body.${body.id}.${k}`,
								value: k == 'name' 
									? body[k].replace(system.name, '')
									: body[k]
							})
						)))
					)))
				)))
				.then(() => {
					rc.quit()
					return { success: true }
				})
			})
		})
		.catch(err => ({ error: err.message }))
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
	.then(routeNames => {
		rc.quit()
		return routeNames
	})
})
		
const route = ({ 
	query: { 
		name, 
		page: pageStr, 
		numPerPage: numPerPageStr
	}
}) => {
	if (name) {
		const page = pageStr ? parseInt(pageStr) : void 0
		const numPerPage = numPerPageStr ? parseInt(numPerPageStr) : void 0
		return getRedisClient()
		.then(rc => {
			const routeId = convertNameToId({ name })
			const getSortedSetRange = getSortedSetRangeWithClient({ rc })
			const getString = getStringWithClient({ rc })
			return Promise.all([
				'name',
				'created',
				'origin',
				'destination',
				'systemCount'
			].map(k => getString({
				key: `${redisGlobalPrepend}.route.${routeId}.${k}`
			})))
			.then(([
				name,
				created,
				origin,
				destination,
				systemCount
			]) => ({
				id: routeId,
				name,
				created,
				origin,
				destination,
				systemCount: parseInt(systemCount)
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
			.then(route => Promise.all([
					'total_credits',
					'total_jumps',
					'total_bodies',
					'completed_bodies'
				].map(k => getString({
					key: `${redisGlobalPrepend}.route.${routeId}.stats.${k}`
				})))
				.then(([
					total_credits,
					total_jumps,
					total_bodies,
					completed_bodies
				]) => ({
					...route,
					stats: {
						total_credits: parseInt(total_credits),
						total_jumps: parseInt(total_jumps),
						total_bodies: parseInt(total_bodies),
						completed_bodies: parseInt(completed_bodies)
					}
				}))
			)
			.then(route => {
				const paged = page != void 0 && numPerPage != void 0
				return getSortedSetRange({
					key: `${redisGlobalPrepend}.route.${routeId}.systems`,
					start: paged
						? page * numPerPage
						: 0,
					stop: paged
						? (page * numPerPage) + (numPerPage - 1)
						: -1
				})
				.then(systems => Promise.all(systems
					.map(systemId => Promise.all([
						'name',
						'order',
						'jumps'
					].map(k => getString({
						key: `${redisGlobalPrepend}.route.${routeId}.system.${systemId}.${k}`
					})))
					.then(([
						name,
						order,
						jumps
					]) => ({
						id: systemId,
						name,
						order,
						jumps
					}))
					.then(system => getSortedSetRange({
							key: `${redisGlobalPrepend}.route.${routeId}.system.${systemId}.bodies`,
							start: 0,
							stop: -1
						})
						.then(bodies => Promise.all(bodies.map(bodyId => Promise.all([
							'name',
							'order',
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
							order,
							complete,
							distance_to_arrival,
							estimated_mapping_value,
							estimated_scan_value,
							is_terraformable,
							subtype,
							type
						]) => ({
							id: bodyId,
							order,
							name,
							complete: complete == 'true',
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
				)
			})
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
		complete: completeStr
	}
}) => getRedisClient()
	.then(rc => {
		const routeId = convertNameToId({ name: routeName })
		const systemId = convertNameToId({ name: systemName })
		const bodyId = convertNameToId({ name: bodyName })
		const setString = setStringWithClient({ rc })
		const incrementBy = incrementByWithClient({ rc })
		const decrementBy = decrementByWithClient({ rc })
		
		const complete = completeStr === 'true'
		const routeKey = `${redisGlobalPrepend}.route.${routeId}`
		const systemKey = `${routeKey}.system.${systemId}`
		const statsKey = `${routeKey}.stats`
		const adjustment = {
			key: `${statsKey}.completed_bodies`,
			value: 1
		}
		const broadcast = (e, p) => process.nextTick(() => io.emit(e, p))
		setString({
			key: `${systemKey}.body.${bodyId}.complete`,
			value: complete
		})
		.then(() => {
			broadcast('body-marked-complete', {
				route: routeName,
				system: systemName,
				body: bodyName,
				complete
			})
			return complete ? incrementBy(adjustment) : decrementBy(adjustment)
		})
		.then(completed_bodies => broadcast('completed_bodies', { completed_bodies }))
		.then(() => rc.quit())
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
				pattern: `${redisGlobalPrepend}.route.${routeId}.*`
			}))
			.then(keys => Promise.all(keys.map(key => delKey({
				key
			}))))
			.then(() => { 
				rc.quit()
			})
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
