
import React, { Component } from 'react'

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

import './App.css'

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
		
		const style = {
		  button: {
		    margin: 10,
		  },
		  input: {
		    display: 'none',
		  },
		  app:{
		  	margin:20
		  }
		}
		
		return (
			<div>
				{
					this.props.error
					? <div>{this.props.error}</div>
					: void 0
				}
				<Typography variant="h4" gutterBottom>
					Routes
				</Typography>
				<Button variant="outlined" style={style.button} onClick={this.props.addNew}>ADD NEW</Button>
    			
    			
    			<div>
					<List>
						{
							this.props.routeNames.map((name, i) => (
								<div key={i}>
									<ListItem button onClick={() => this.props.selectRoute({ 
										name,
										page: this.props.selectedSystemsPage,
										numPerPage: this.props.selectedSystemsNumPerPage 
									})}>
									<ListItemIcon>
										<InboxIcon />
									</ListItemIcon>
									<ListItemText primary={name} />
									<ListItemSecondaryAction>
										<IconButton aria-label="Delete" onClick={() => this.props.deleteRoute({ name })}>
										<DeleteIcon />
										</IconButton>
										</ListItemSecondaryAction>
							        </ListItem>
								</div>
							))
						}
					</List>
			    </div>
			</div>
		)
	}
}
//<button onClick={() => this.props.deleteRoute({ name })}>X</button>
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
	selectRoute: ({ 
		name,
		page,
		numPerPage
	}) => dispatch => {
		fetch(`/api/r2r-route/route?name=${name}&page=${page}&numPerPage=${numPerPage}`)
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
