
export default (state = {
	routeNames: [],
    selected: null,
    loading: false,
    adding: false,
    saving: false,
    deleting: false
}, { type, ...action }) => {
	const change = {}
	const clear = () => {
		change.loading = false
		change.deleting = false
		change.saving = false
		change.adding = false
		change.routeNames = []
	}
	switch (type) {
		case 'set-route-names':
			change.routeNames = action.routeNames
			break
		case 'clear-route-names':
			change.routeNames = []
			break
		case 'set-selected-route':
			change.selected = action.route
			clear()
			break
		case 'loading':
			change.loading = true
			break
		case 'clear-selected-route':
			change.selected = null
			break
		case 'show-new-route':
			change.adding = true
			break
		case 'hide-new-route':
			clear()
			break
		case 'saving':
			change.saving = true
			break
		case 'saved':
			clear()
			break
		case 'deleting':
			change.deleting = true
			break
		case 'deleted':
			clear()
			break
		default:
			break
	}
	return Object.assign({ ...state }, change)
}
