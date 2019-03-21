
import React from 'react'
import './App.css'
import 'typeface-roboto'

import { connect } from 'react-redux'

const c = ({
	selected,
	clearSelected
}) => (
	<div className="App">
		<div>ROUTE VIEW:</div>
		<div onClick={clearSelected}>{'<-'}</div>
		<div>{JSON.stringify(selected)}</div>
	</div>
)

export default connect(state => state, {
	clearSelected: () => ({
		type: 'clear-selected-route'
	})
})(c)
