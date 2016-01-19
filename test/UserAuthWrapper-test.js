/* eslint-env node, mocha, jasmine */
import React, { Component, PropTypes } from 'react'
import { Route, Router } from 'react-router'
import { Provider } from 'react-redux'
import { applyMiddleware, createStore, combineReducers, compose } from 'redux'
import { renderIntoDocument } from 'react-addons-test-utils'
import createMemoryHistory from 'react-router/lib/createMemoryHistory'
import { routeReducer, syncHistory  } from 'redux-simple-router'

import { UserAuthWrapper } from '../src'

const USER_LOGGED_IN = 'USER_LOGGED_IN'
const USER_LOGGED_OUT = 'USER_LOGGED_OUT'

const userReducer = (state = {}, { type, payload }) => {
  if (type === USER_LOGGED_IN) {
    return payload
  }
  if (type === USER_LOGGED_OUT) {
    return {}
  }
  return state
}

const rootReducer = combineReducers({
  routing: routeReducer,
  user: userReducer
})

const configureStore = (history, initialState) => {
  const routerMiddleware = syncHistory(history)

  const createStoreWithMiddleware = compose(
    applyMiddleware(routerMiddleware)
  )(createStore)

  return createStoreWithMiddleware(rootReducer, initialState)
}

class App extends Component {
  static propTypes = {
    children: PropTypes.node
  };

  render() {
    return (
      <div>
        {this.props.children}
      </div>
    )
  }
}

class UnprotectedComponent extends Component {
  render() {
    return (
      <div />
    )
  }
}

const userSelector = state => state.user

const UserIsAuthenticated = UserAuthWrapper(userSelector)('/login', 'UserIsAuthenticated')

const HiddenNoRedir = UserAuthWrapper(userSelector)('/', 'NoRedir', () => false, false)

const UserIsOnlyTest = UserAuthWrapper(userSelector)('/', 'UserIsOnlyTest', user => user.firstName === 'Test')

const UserIsOnlyMcDuderson = UserAuthWrapper(userSelector)('/', 'UserIsOnlyMcDuderson', user => user.lastName === 'McDuderson')

const routes = (
  <Route path="/" component={App} >
    <Route path="login" component={UnprotectedComponent} />
    <Route path="auth" component={UserIsAuthenticated(UnprotectedComponent)} />
    <Route path="hidden" component={HiddenNoRedir(UnprotectedComponent)} />
    <Route path="testOnly" component={UserIsOnlyTest(UnprotectedComponent)} />
    <Route path="testMcDudersonOnly" component={UserIsOnlyMcDuderson(UserIsOnlyTest(UnprotectedComponent))} />
  </Route>
)

const userLoggedIn = (firstName = 'Test', lastName = 'McDuderson') => {
  return {
    type: USER_LOGGED_IN,
    payload: {
      email: 'test@test.com',
      firstName,
      lastName
    }
  }
}

const setupTest = () => {
  const history = createMemoryHistory()
  const store = configureStore(history)

  renderIntoDocument(
    <Provider store={store}>
      <Router history={history} >
        {routes}
      </Router>
    </Provider>
  )

  return {
    history,
    store
  }
}

describe('UserAuthWrapper', () => {
  it('redirects unauthenticated', () => {
    const { history, store } = setupTest()

    expect(store.getState().routing.location.pathname).to.equal('/')
    expect(store.getState().routing.location.search).to.equal('')
    history.push('/auth')
    expect(store.getState().routing.location.pathname).to.equal('/login')
    expect(store.getState().routing.location.search).to.equal('?redirect=%2Fauth')
  })

  it('preserves query params on redirect', () => {
    const { history, store } = setupTest()

    expect(store.getState().routing.location.pathname).to.equal('/')
    expect(store.getState().routing.location.search).to.equal('')
    history.push('/auth?test=foo')
    expect(store.getState().routing.location.pathname).to.equal('/login')
    expect(store.getState().routing.location.search).to.equal('?redirect=%2Fauth%3Ftest%3Dfoo')
  })

  it('allows authenticated users', () => {
    const { history, store } = setupTest()

    store.dispatch(userLoggedIn())

    history.push('/auth')
    expect(store.getState().routing.location.pathname).to.equal('/auth')
  })

  it('redirects on no longer authorized', () => {
    const { history, store } = setupTest()

    store.dispatch(userLoggedIn())

    history.push('/auth')
    expect(store.getState().routing.location.pathname).to.equal('/auth')

    store.dispatch({ type: USER_LOGGED_OUT })
    expect(store.getState().routing.location.pathname).to.equal('/login')
  })

  it('allows predicate authorization', () => {
    const history = createMemoryHistory()
    const store = configureStore(history)

    renderIntoDocument(
      <Provider store={store}>
        <Router history={history} >
          {routes}
        </Router>
      </Provider>
    )

    store.dispatch(userLoggedIn('NotTest'))

    history.push('/testOnly')
    expect(store.getState().routing.location.pathname).to.equal('/')
    expect(store.getState().routing.location.search).to.equal('?redirect=%2FtestOnly')

    store.dispatch(userLoggedIn())

    history.push('/testOnly')
    expect(store.getState().routing.location.pathname).to.equal('/testOnly')
    expect(store.getState().routing.location.search).to.equal('')
  })


  it('optionally prevents redirection', () => {
    const { history, store } = setupTest()

    store.dispatch(userLoggedIn())

    history.push('/hidden')
    expect(store.getState().routing.location.pathname).to.equal('/')
    expect(store.getState().routing.location.search).to.equal('')
  })

  it('can be nested', () => {
    const { history, store } = setupTest()

    store.dispatch(userLoggedIn('NotTest'))

    history.push('/testMcDudersonOnly')
    expect(store.getState().routing.location.pathname).to.equal('/')
    expect(store.getState().routing.location.search).to.equal('?redirect=%2FtestMcDudersonOnly')

    store.dispatch(userLoggedIn('Test', 'NotMcDuderson'))

    history.push('/testMcDudersonOnly')
    expect(store.getState().routing.location.pathname).to.equal('/')
    expect(store.getState().routing.location.search).to.equal('?redirect=%2FtestMcDudersonOnly')

    store.dispatch(userLoggedIn())

    history.push('/testMcDudersonOnly')
    expect(store.getState().routing.location.pathname).to.equal('/testMcDudersonOnly')
    expect(store.getState().routing.location.search).to.equal('')
  })
})