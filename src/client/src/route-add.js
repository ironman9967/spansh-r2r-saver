
import React from 'react'
import './App.css'
import 'typeface-roboto'

import { connect } from 'react-redux'

import TextField from '@material-ui/core/TextField'

const fields = [{
	id: 'name',
	label: 'name',
	type: 'text',
	defVal: 'route-1'
},{
	id: 'to',
	label: 'to',
	type: 'text',
	defVal: ''
}, {
	id: 'range',
	label: 'range',
	type: 'number',
	defVal: 69
}, {
	id: 'radius',
	label: 'radius',
	type: 'number',
	defVal: 207
}, {
	id: 'max_distance',
	label: 'max distance',
	type: 'number',
	defVal: 1000000
}, {
	id: 'max_results',
	label: 'max results',
	type: 'number',
	defVal: 10
}, {
	id: 'from',
	label: 'from',
	type: 'text',
	defVal: 'Sol'
}, {
	id: 'min_value',
	label: 'min value',
	type: 'number',
	defVal: 300000
}, {
	id: 'use_mapping_value',
	label: 'use mapping value',
	type: 'checkbox',
	defVal: true
}]

const c = ({
	stopAdd,
	save,
	saving
}) => {
	const route = fields.reduce((route, {
		id,
		label,
		defVal
	}) => {
		route[id] = defVal
		return route
	}, {})
	const textBoxStyle = {
		margin: '5px'
	}
	return (
		<div className="App">
			<div>NEW ROUTE:</div>
			<div onClick={stopAdd}>{'<-'}</div>
			{
				fields.map(({
					id,
					label,
					defVal
				}, i) => (
					<TextField 
						style={textBoxStyle}
						key={i}
						label={label}
						defaultValue={defVal.toString()}
						onChange={({ target: { value }}) => route[id] = value}
					/>
				))
			}
			<button onClick={() => save({ route })}>SAVE</button>
		</div>
	)
}

export default connect(state => state, {
	stopAdd: () => ({
		type: 'hide-new-route'
	}),
	save: ({ route }) => dispatch => {
		fetch(`/api/r2r-route/save?${
			fields.map(({
				id,
				label,
				type,
				defVal
			}) => `${id}=${route[id]}`).join('&')
		}`)
		.then(res => res.json())
		.then(() => dispatch({
			type: 'saved'
		}))
		
		dispatch({
			type: 'saving'
		})
	}
})(c)
