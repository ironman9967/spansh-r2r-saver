import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import AirplanemodeActive from '@material-ui/icons/AirplanemodeActive';

const styles = {
  root: {
    flexGrow: 1,
  },
  airplanemodeActive: {
    marginLeft: -18,
    marginRight: 10,
  },
};

function DenseAppBar(props) {
  const { classes } = props;
  return (
    <div className={classes.root}>
      <AppBar position="static">
        <Toolbar variant="dense">
          <IconButton className={classes.airplanemodeActive} color="inherit" aria-label="AirplanemodeActive">
            <AirplanemodeActive />
          </IconButton>
          <Typography variant="h6" color="inherit">
            Spansh R2R Server
          </Typography>
        </Toolbar>
      </AppBar>
    </div>
  );
}

DenseAppBar.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(DenseAppBar);