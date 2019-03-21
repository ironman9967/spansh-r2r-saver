
import React from 'react'
import './App.css'
import 'typeface-roboto'

import { connect } from 'react-redux'

import RouteView from './route-view'
import RouteList from './route-list'
import RouteAdd from './route-add'

const c = ({
	routeNames,
	routes,
	adding,
	addNew,
	selected,
	loading,
	saving,
	deleting
}) => (
	<div className="App">
		{loading
			? <div className="App">LOADING ROUTE...</div>
			: deleting
				? <div className="App">DELETING...</div>
				: saving
					? <div className="App">SAVING...</div>
					: adding
						? <RouteAdd />
						: selected 
							? <RouteView /> 
							: <RouteList />}
	</div>
)

export default connect(state => state, {})(c)