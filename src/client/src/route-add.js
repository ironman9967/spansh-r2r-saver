
import React from 'react'
import './App.css'
import 'typeface-roboto'

import { connect } from 'react-redux'

import TextField from '@material-ui/core/TextField'

import fields from './route-settings-fields'

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
		.then(({ error }) => error
			? Promise.reject(error)
			: void 0)
		.then(() => dispatch({
			type: 'saved'
		}))
		.catch(error => dispatch({
			type: 'error',
			error
		}))
		
		dispatch({
			type: 'saving'
		})
	}
})(c)
