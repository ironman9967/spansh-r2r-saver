
import React from 'react'
import './App.css'
import 'typeface-roboto'

import { connect } from 'react-redux'

import Table from '@material-ui/core/Table'
import TableHead from '@material-ui/core/TableHead'
import TableBody from '@material-ui/core/TableBody'
import TableRow from '@material-ui/core/TableRow'
import TableCell from '@material-ui/core/TableCell'
import TableFooter from '@material-ui/core/TableFooter'
import TablePagination from '@material-ui/core/TablePagination'
import Checkbox from '@material-ui/core/Checkbox'
import TextField from '@material-ui/core/TextField'


import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';
import InboxIcon from '@material-ui/icons/Inbox';
import DraftsIcon from '@material-ui/icons/Drafts';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import Avatar from '@material-ui/core/Avatar';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';


import Typography from '@material-ui/core/Typography';

import RouteStatsTable from './route-stats-table'

import routeSettingFields from './route-settings-fields'

import SystemName from './components/SystemName'

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
	selectedSystemCount,
	selectedSystemsPage,
	selectedSystemsNumPerPage,
	updateSelected,
	clearSelected,
	setBodyComplete
}) => {
	let goToPageStr = '0'
	
	const style = {
	  button: {
	    margin: 10,
	  },
	  input: {
	    display: 'none',
	  },
	  app:{
	  	margin:20
	  },
	  section: {
	  	marginTop:20
	  }
	}
	
	// const copyToClipboard = (e) => {
 //   this.textArea.select();
 //   document.execCommand('copy');
 //   // This is just personal preference.
 //   // I prefer to not show the the whole text area selected.
 //   e.target.focus();
 //   this.setState({ copySuccess: 'Copied!' });
 // };
 
		console.log(selected)
		
	return (
		<div>
			
			<Typography variant="h4" gutterBottom>
				{selected.name}
			</Typography>
			<Button variant="outlined" style={style.button} onClick={clearSelected}>back</Button>

			<div style={style.section}>
				<Typography component="h5" gutterBottom>
		          Route
		        </Typography>
				<Table>
					<TableHead>
						<TableRow>
						{
							routeSettingFields.map(({ label }, i) => {
							
								return <TableCell key={i}>{label}</TableCell>
							})
						}
						</TableRow>
					</TableHead>
					<TableBody>
						<TableRow>
						{
							routeSettingFields.map(({ id }, i) => id === 'name'
								? (
									<TableCell 
										key={i}
										style={{
											minWidth: 100
										}}
									>{selected.name}</TableCell>
								)
								: (
									<TableCell key={i}>{selected.settings[id]}</TableCell>
								))
						}
						</TableRow>
					</TableBody>
				</Table>
				<RouteStatsTable />
			</div>
			<div style={style.section}>
				<Typography component="h5" gutterBottom>
		          Systems
		        </Typography>
				<Table>
					<TableHead>
						<TableRow>
						{
							systemFields.map(({ id, label }) => id === 'name'
							? (
								<TableCell 
									key={id}
									style={{
										minWidth: 200
									}}
								>{label}</TableCell> 
							)
							: (
								<TableCell key={id}>{label}</TableCell>
							))
						}
						</TableRow>
					</TableHead>
					<TableBody>
					{
						selected.systems.sort(({ order: o1 }, { order: o2}) => parseInt(o1) <= parseInt(o2)
							? -1
							: 1
						).map((system, i) => (
							<TableRow key={i}>
							{
								systemFields.map(({ id }) => id !== 'bodies'
									? (
										<TableCell key={id}>
											<SystemName name={system[id]}/>
										</TableCell>
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
													system.bodies.sort(({ order: o1 }, { order: o2}) => o1 <= o2
														? -1
														: 1
													).map((body, i) => (
														<TableRow key={i}>
														{
															bodyFields.map(({ id }) => (
																<TableCell key={id}>{
																	id === 'complete'
																	? <Checkbox
																		checked={body[id]}
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
					<TableFooter>
						<TableRow>
							<TablePagination
								rowsPerPageOptions={[5, 10, 25]}
								colSpan={3}
								count={selected.systemCount}
								rowsPerPage={selectedSystemsNumPerPage}
								page={selectedSystemsPage}
								SelectProps={{
									native: true,
								}}
								onChangePage={(event, page) => updateSelected({ 
									name: selected.name,
									page,
									numPerPage: selectedSystemsNumPerPage
								})}
								onChangeRowsPerPage={event => updateSelected({ 
									name: selected.name,
									page: 0,
									numPerPage: parseInt(event.target.value)
								})}
							/>
						</TableRow>
					</TableFooter>
				</Table>
			</div>
			<TextField
				label={`1-${Math.ceil(selected.systemCount / selectedSystemsNumPerPage)}`}
				onChange={event => goToPageStr = event.target.value}
			/>
			<div onClick={() => {
				const page = parseInt(goToPageStr) - 1
				if (!isNaN(page)) {
					updateSelected({ 
						name: selected.name,
						page,
						numPerPage: selectedSystemsNumPerPage
					})
				}
				else {
					console.log(`'${goToPageStr}' is not a number`)
				}
			}}>go to page</div>
		</div>
	)
}

export default connect(state => state, {
	clearSelected: () => ({
		type: 'clear-selected-route'
	}),
	setBodyComplete: ({
		selected,
		system,
		body,
		complete
	}) => dispatch => fetch(`/api/r2r-route/set-body-complete?routeName=${selected.name}&systemName=${system.name}&bodyName=${body.name}&complete=${complete}`),
	updateSelected: ({
		name,
		page,
		numPerPage
	}) => dispatch => {
		dispatch({
			type: 'loading'
		})
		dispatch({
			type: 'set-selected-num-per-page',
			page,
			numPerPage
		})
		dispatch({
			type: 'set-selected-page',
			page
		})
		fetch(`/api/r2r-route/route?name=${name}&page=${page}&numPerPage=${numPerPage}`)
			.then(res => res.json())
			.then(route => dispatch({
				type: 'set-selected-route',
				route
			}))
	}
})(c)
