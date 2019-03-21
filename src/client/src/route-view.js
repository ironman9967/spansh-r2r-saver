
import React from 'react'
import './App.css'
import 'typeface-roboto'

import { connect } from 'react-redux'

import Table from '@material-ui/core/Table'
import TableHead from '@material-ui/core/TableHead'
import TableBody from '@material-ui/core/TableBody'
import TableRow from '@material-ui/core/TableRow'
import TableCell from '@material-ui/core/TableCell'
import Checkbox from '@material-ui/core/Checkbox'

// import routeSettingFields from './route-settings-fields'

const systemFields = [{
	id: 'name',
	label: 'name'
}, {
	id: 'jumps',
	label: 'jumps'
}, {
	id: 'bodies',
	label: 'bodies'
}]

const bodyFields = [{
	id: 'complete',
	label: 'complete'
}, {
	id: 'name',
	label: 'name'
}, {
	id: 'distance_to_arrival',
	label: 'distance'
}, {
	id: 'estimated_mapping_value',
	label: 'mapping value'
}, {
	id: 'estimated_scan_value',
	label: 'scan value'
}, {
	id: 'is_terraformable',
	label: 'terraformable?'
}, {
	id: 'subtype',
	label: 'subtype'
}, {
	id: 'type',
	label: 'type'
}]

const c = ({
	selected,
	clearSelected,
	setBodyComplete
}) => (
	<div className="App">
		<div>ROUTE VIEW:</div>
		<div onClick={clearSelected}>{'<-'}</div>
		<Table>
			<TableHead>
				<TableRow>
				{
					systemFields.map(({ id, label }) => (
						<TableCell key={id}>{label}</TableCell>
					))
				}
				</TableRow>
			</TableHead>
			<TableBody>
			{
				selected.systems.map((system, i) => (
					<TableRow key={i}>
					{
						systemFields.map(({ id }) => id !== 'bodies'
							? (
								<TableCell key={id}>{system[id]}</TableCell>
							)
							: (
								<TableCell key={id}>
									<Table>
										<TableHead>
											<TableRow>
											{
												bodyFields.map(({ id, label }) => (
													<TableCell key={id}>{label}</TableCell>
												))
											}
											</TableRow>
										</TableHead>
										<TableBody>
										{
											system.bodies.map((body, i) => (
												<TableRow key={i}>
												{
													bodyFields.map(({ id }) => (
														<TableCell key={id}>{
															id === 'complete'
															? <Checkbox
																checked={body[id] === 'true'}
																onChange={event => setBodyComplete({
																	selected,
																	system,
																	body,
																	complete: event.target.checked
																})}
															/>
															: body[id]
														}</TableCell>
													))
												}
												</TableRow>
											))
										}
										</TableBody>
									</Table>
								</TableCell>
							))
					}
					</TableRow>
				))
			}
			</TableBody>
		</Table>
	</div>
)

export default connect(state => state, {
	clearSelected: () => ({
		type: 'clear-selected-route'
	}),
	setBodyComplete: ({
		selected,
		system,
		body,
		complete
	}) => dispatch => fetch([
		`/api/r2r-route/set-body-complete`,
		`?routeName=${selected.name}`,
		`&systemName=${system.name}`,
		`&bodyName=${body.name}`,
		`&complete=${complete}`
	].join(''))
	.then(res => res.json())
	.then(res => dispatch({
		type: 'body-marked-complete',
		res,
		route: selected.name,
		system: system.name,
		body: body.name,
		complete
	}))
})(c)
