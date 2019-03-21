
import React, { Component } from 'react'
import './App.css'
import 'typeface-roboto'

import { connect } from 'react-redux'

class c extends Component {
	componentDidMount() {
		if (this.props.routeNames.length === 0) {
			this.props.loadRouteNames()
		}
	}
	
	componentWillUnmount() {
		this.props.clearRouteNames()
	}
	
	render() {
		return (
			<div className="App">
				<div>ROUTES:</div>
				<div onClick={this.props.addNew}>ADD NEW</div>
				{
					this.props.routeNames.map((name, i) => (
						<div key={i}>
							<div onClick={() => this.props.selectRoute({ name })}>{name}</div>
							<button onClick={() => this.props.deleteRoute({ name })}>X</button>
						</div>
					))
				}
			</div>
		)
	}
}

export default connect(state => state, {
	loadRouteNames: () => dispatch => fetch('/api/r2r-route/routes')
		.then(res => res.json())
		.then(routeNames => dispatch({
			type: 'set-route-names',
			routeNames
		})),
	clearRouteNames: () => ({
		type: 'clear-route-names'
	}),
	selectRoute: ({ name }) => dispatch => {
		fetch(`/api/r2r-route/route?name=${name}`)
			.then(res => res.json())
			.then(route => dispatch({
				type: 'set-selected-route',
				route
			}))
		dispatch({
			type: 'loading'
		})
	},
	addNew: () => ({
		type: 'show-new-route'
	}),
	deleteRoute: ({ name }) => dispatch => {
		fetch(`/api/r2r-route/delete-route?name=${name}`)
		.then(() => dispatch({
			type: 'deleted'
		}))
		
		dispatch({
			type: 'deleting'
		})
	}
})(c)
