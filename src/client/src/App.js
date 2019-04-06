
import React from 'react'


import Typography from '@material-ui/core/Typography';

import AppBar from './components/appBar'


import './App.css'




import { connect } from 'react-redux'

import RouteView from './route-view'
import RouteList from './route-list'
import RouteAdd from './route-add'

const style = {
  app:{
  	margin:20
  }
}

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
	<div>
		<AppBar/>
		<div style={style.app}>
		{loading
			? <Typography variant="subheading" gutterBottom>LOADING ROUTE...</Typography>
			: deleting
				? <Typography variant="subheading" gutterBottom>DELETING...</Typography>
				: saving
					? <Typography variant="subheading" gutterBottom>SAVING...</Typography>
					: adding
						? <RouteAdd />
						: selected 
							? <RouteView /> 
							: <RouteList />}
		</div>
	</div>
)

export default connect(state => state, {})(c)