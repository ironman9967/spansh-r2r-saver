const proxy = require('http-proxy-middleware')
module.exports = function(app) {
    app.use(proxy('/api/r2r-route/view', { target: 'http://localhost:8000' }))
    app.use(proxy('/api/r2r-route/save', { target: 'http://localhost:8000' }))
    app.use(proxy('/api/r2r-route/routes', { target: 'http://localhost:8000' }))
    app.use(proxy('/api/r2r-route/route', { target: 'http://localhost:8000' }))
    app.use(proxy('/api/r2r-route/delete-route', { target: 'http://localhost:8000' }))
}