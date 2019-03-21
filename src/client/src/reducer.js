
export default (state = {
	routeNames: [],
    selected: null,
    loading: false,
    adding: false,
    saving: false,
    deleting: false
}, { type, ...action }) => {
	const clear = s => ({
		...s,
		loading: false,
		deleting: false,
		saving: false,
		adding: false,
		routeNames: []
	})
	switch (type) {
		case 'set-route-names':
			return {...state, routeNames: action.routeNames }
		case 'clear-route-names':
			return {...state, routeNames: [] }
		case 'set-selected-route':
			return {...state, ...clear(state), selected: action.route }
		case 'loading':
			return {...state, loading: true }
		case 'clear-selected-route':
			return {...state, selected: null }
		case 'show-new-route':
			return {...state, adding: true }
		case 'hide-new-route':
			return clear(state)
		case 'saving':
			return {...state, saving: true }
		case 'saved':
			return clear(state)
		case 'deleting':
			return {...state, deleting: true }
		case 'deleted':
			return clear(state)
		case 'body-marked-complete':
			return {
				...state, 
				selected : {
					...state.selected, 
					systems: state.selected.systems.map(system => system.name === action.system 
						? ({
							...system, 
							bodies: system.bodies.map(body => body.name === action.body 
								? ({
									...body, 
									complete: action.complete
									
								}) 
								: ({...body}))}) 
						: ({...system}) 
					)} 
				
			}
		default:
			break
	}
	return state
}
