var mongoose = require('mongoose')
mongoose.Promise = global.Promise;
// 连接数据库
mongoose.connect('mongodb://localhost/acm1', { useMongoClient: true })

module.exports = mongoose