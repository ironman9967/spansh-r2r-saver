
import React from 'react'
import './App.css'
import 'typeface-roboto'

import { connect } from 'react-redux'

import Table from '@material-ui/core/Table'
import TableHead from '@material-ui/core/TableHead'
import TableBody from '@material-ui/core/TableBody'
import TableRow from '@material-ui/core/TableRow'
import TableCell from '@material-ui/core/TableCell'

const routeStatFields = [{
	id: 'progress',
	label: 'progress'
}, {
	id: 'completed_bodies',
	label: 'completed bodies'
}, {
	id: 'total_bodies',
	label: 'total bodies'
}, {
	id: 'total_jumps',
	label: 'total jumps'
}, {
	id: 'total_credits',
	label: 'total credits'
}]

const c = ({
	rawStats
}) => {
	return (
		<Table>
			<TableHead>
				<TableRow>
				{
					routeStatFields.map(({ label }, i) => (
						<TableCell key={i} align="right">{label}</TableCell>
					))
				}
				</TableRow>
			</TableHead>
			<TableBody>
				<TableRow>
				{
					routeStatFields.map(({ id }, i) => {
						const stats = { ...rawStats }
						stats.progress = Math.ceil((stats.completed_bodies / stats.total_bodies) * 100)
						return (
							<TableCell key={i} align="right">
							{
								`${stats[id]}${ id === 'progress' ? '%' : '' }`
							}
							</TableCell>
						)
					})
				}
				</TableRow>
			</TableBody>
		</Table>
	)
}

export default connect(({
	selected: {
		stats
	}
}) => ({
	rawStats: stats
}))(c)
