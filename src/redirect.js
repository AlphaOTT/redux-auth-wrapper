import React, { Component } from 'react'
import { Navigate } from 'react-router-dom'
import PropTypes from 'prop-types'

export default class Redirect extends Component {
  static propTypes = {
    redirectParams: PropTypes.object.isRequired,
  };

  render() {
    return <Navigate to={this.props.redirectParams} />
  }
}
