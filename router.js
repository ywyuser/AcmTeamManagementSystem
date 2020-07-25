var express = require('express')
var Models = require('./models/models')
var Action = require('./models/action')
var Group = require('./models/group')
var Coach = require('./models/coach')
var Years = require('./models/yeardb')
var User = require('./models/user')
var md5 = require('blueimp-md5')
    //tu
var multer = require('multer')
var fs = require('fs')
var bodyParser = require('body-parser')
var router = express.Router()
    //(必须引入的模块)
var createFolder = function(folder) {
    try {
        fs.accessSync(folder);
    } catch (e) {
        fs.mkdirSync(folder);
    }
};

var uploadFolder = './upload/';

createFolder(uploadFolder);
//默认存在/tmp/my-uploads
var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, uploadFolder)
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname)

    }

})

var upload = multer({ storage: storage })
router.get('/login', function(req, res) {
    res.render('login.html')
})

router.post('/login', function(req, res) {
    // 1. 获取表单数据
    // 2. 查询数据库用户名密码是否正确
    // 3. 发送响应数据

    var body = req.body

    User.findOne({
        email: body.email,
        password: md5(md5(body.password))
    }, function(err, user) {
        if (err) {
            return res.status(500).json({
                err_code: 500,
                message: err.message
            })
        }

        //如果邮箱和密码匹配，则 user 是查询到的用户对象，否则就是 null
        if (!user) {
            return res.status(200).json({
                err_code: 1,
                message: 'Email or password is invalid.'
            })
        }

        // 用户存在，登陆成功，通过 Session 记录登陆状态
        req.session.user = user

        res.status(200).json({
            err_code: 0,
            message: 'OK'
        })
    })
})
router.get('/register', function(req, res) {
    res.render('register.html')
})
router.post('/register', function(req, res) {
    // 1. 获取表单提交的数据
    //    req.body
    // 2. 操作数据库
    //    判断改用户是否存在
    //    如果已存在，不允许注册
    //    如果不存在，注册新建用户
    // 3. 发送响应
    var body = req.body
    User.findOne({
        $or: [{
                email: body.email
            },
            {
                nickname: body.nickname
            }
        ]
    }, function(err, data) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: '服务端错误'
            })
        }
        // console.log(data)
        if (data) {
            // 邮箱或者昵称已存在
            return res.status(200).json({
                err_code: 1,
                message: 'Email or nickname aleady exists.'
            })
            return res.send(`邮箱或者密码已存在，请重试`)
        }

        // 对密码进行 md5 重复加密
        body.password = md5(md5(body.password))

        new User(body).save(function(err, user) {
            if (err) {
                return res.status(500).json({
                    err_code: 500,
                    message: 'Internal error.'
                })
            }

            // 注册成功，使用 Session 记录用户的登陆状态
            req.session.user = user

            // Express 提供了一个响应方法：json
            // 该方法接收一个对象作为参数，它会自动帮你把对象转为字符串再发送给浏览器
            res.status(200).json({
                err_code: 0,
                message: 'OK'
            })

            // 服务端重定向只针对同步请求才有效，异步请求无效
            // res.redirect('/')
        })
    })
})
router.get('/logout', function(req, res) {
        // 清除登陆状态
        req.session.user = null

        // 重定向到登录页
        res.redirect('/login')
    })
    //index.html

router.get('/year/:year/excel/:item', function(req, res) {
        // console.log(req.params)

        //res.send(req.params.id)
        var path1 = ''
        if (req.session.user == null) {
            path1 = 'models.html'
        } else {
            path1 = 'index1.html'
        }

        //console.log(req.params.item)
        var yeardate = []
        Years.find(
            function(err, itemss) {
                if (err) {
                    return res.status(500).json({
                        err_code: 500,
                        message: err.message
                    })
                }
                yeardate = itemss


            })



        if (req.params.item == "Models") {

            Models.find({
                    year: req.params.year
                },
                function(err, items) {
                    if (err) {
                        return res.status(500).json({
                            err_code: 500,
                            message: err.message
                        })
                    }
                    var a = []
                    var leng = items.length
                    if (items.length == 0) {
                        leng = 1
                    }
                    for (var i = 0; i < leng; i++) {
                        a[i] = {
                            _id: '',
                            name: '',
                            time: '',
                            detail: '',
                            others: '',
                            imgname: []
                        }


                    }

                    for (var i = 0; i < items.length; i++) {
                        a[i].name = items[i].name
                        a[i].time = items[i].time
                        a[i].detail = items[i].detail
                        a[i].others = items[i].others
                        a[i].imgname = JSON.parse(JSON.stringify(items[i].imgname))
                        a[i]._id = JSON.parse(JSON.stringify(items[i]._id))
                    }

                    if (a[0]._id == '') {
                        res.render(path1, {
                            user: req.session.user,

                            unit: "ACM获奖",
                            item: req.params.item,
                            year: req.params.year,
                            Years: yeardate
                        })
                    }
                    res.render(path1, {
                        user: req.session.user,
                        Models: a,
                        unit: "ACM获奖",
                        item: req.params.item,
                        year: req.params.year,
                        Years: yeardate
                    })

                })
        } else if (req.params.item == "Group") {
            Group.find({
                    year: req.params.year
                },
                function(err, items) {
                    if (err) {
                        return res.status(500).json({
                            err_code: 500,
                            message: err.message
                        })
                    }

                    var a = []
                    var leng = items.length
                    if (items.length == 0) {
                        leng = 1
                    }
                    for (var i = 0; i < leng; i++) {
                        a[i] = {
                            _id: '',
                            name: '',
                            class: '',
                            gender: '',
                            direct: '',
                            imgname: []
                        }


                    }

                    if (items != [])
                        for (var i = 0; i < items.length; i++) {
                            a[i].name = items[i].name
                            a[i].class = items[i].class
                            a[i].gender = items[i].gender
                            a[i].direct = items[i].direct
                            a[i].imgname = JSON.parse(JSON.stringify(items[i].imgname))
                            a[i]._id = JSON.parse(JSON.stringify(items[i]._id))
                        }

                    if (a[0]._id == '') {
                        res.render(path1, {
                            user: req.session.user,

                            unit: "ACM队员",
                            item: req.params.item,
                            year: req.params.year,
                            Years: yeardate
                        })
                    }
                    res.render(path1, {
                        user: req.session.user,
                        Group: a,
                        unit: "ACM队员",
                        item: req.params.item,
                        year: req.params.year,
                        Years: yeardate
                    })

                })
        } else if (req.params.item == "Action") {
            Action.find({
                    year: req.params.year
                },
                function(err, items) {
                    if (err) {
                        return res.status(500).json({
                            err_code: 500,
                            message: err.message
                        })
                    }
                    // for (var i = 0; i < items.length; i++) {

                    //     items[i].imgname = JSON.parse(items[i].imgname)
                    // }




                    // console.log(items)
                    var leng = items.length
                    if (items.length == 0) {
                        leng = 1
                    }
                    var a = []
                    for (var i = 0; i < leng; i++) {
                        a[i] = {
                            _id: '',
                            name: '',
                            time: '',
                            message: '',
                            result: '',
                            imgname: []
                        }


                    }
                    for (var i = 0; i < items.length; i++) {
                        a[i].name = items[i].name
                        a[i].time = items[i].time
                        a[i].message = items[i].message
                        a[i].result = items[i].result
                        a[i].imgname = JSON.parse(JSON.stringify(items[i].imgname))
                        a[i]._id = JSON.parse(JSON.stringify(items[i]._id))
                    }
                    if (a[0]._id == '') {
                        res.render(path1, {
                            user: req.session.user,


                            unit: "校内活动",
                            item: req.params.item,
                            year: req.params.year,
                            Years: yeardate
                        })
                    }
                    res.render(path1, {
                        user: req.session.user,

                        Action: a,
                        unit: "校内活动",
                        item: req.params.item,
                        year: req.params.year,
                        Years: yeardate
                    })

                })
        } else if (req.params.item == "Coach") {
            Coach.find(
                function(err, items) {
                    if (err) {
                        return res.status(500).json({
                            err_code: 500,
                            message: err.message
                        })
                    }
                    var leng = items.length
                    if (items.length == 0) {
                        leng = 1
                    }
                    var a = []
                    for (var i = 0; i < leng; i++) {
                        a[i] = {
                            _id: '',
                            yuan: '',
                            name: '',
                            gender: '',
                            others: '',
                            imgname: []
                        }


                    }
                    for (var i = 0; i < items.length; i++) {
                        a[i].name = items[i].name
                        a[i].yuan = items[i].yuan
                        a[i].gender = items[i].gender
                        a[i].others = items[i].others
                        a[i].imgname = JSON.parse(JSON.stringify(items[i].imgname))
                        a[i]._id = JSON.parse(JSON.stringify(items[i]._id))
                    }
                    if (a[0]._id == '') {
                        res.render(path1, {
                            user: req.session.user,

                            unit: "教练",
                            item: req.params.item,
                            year: req.params.year,
                            Years: yeardate
                        })
                    }
                    res.render(path1, {
                        user: req.session.user,
                        Coach: a,
                        unit: "教练",
                        item: req.params.item,
                        year: req.params.year,
                        Years: yeardate
                    })

                })
        }




    })
    //index1.html
router.get('/year/:year/excel/:item/new', function(req, res) {


    // console.log(req.session.user)
    var newhtml = ''
    if (req.params.item == 'Models') {
        newhtml = "new.html"
    } else if (req.params.item == 'Group') {
        newhtml = "new1.html"
    } else if (req.params.item == 'Action') {
        newhtml = "new2.html"
    } else {
        newhtml = "new3.html"
    }
    var form = fs.readFileSync('./views/' + newhtml, { encoding: "utf8" });
    res.render(newhtml, {
            user: req.session.user,
            item: req.params.item,
            year: req.params.year
        })
        //res.send(req.params.id)
        // if (req.params.item == "Models") {
        //     Models.find({
        //         year: req.params.year
        //     }, function(err, items) {
        //         if (err) {
        //             return res.status(500).json({
        //                 err_code: 500,
        //                 message: err.message
        //             })
        //         }
        //         res.render(newhtml, {
        //             user: req.session.user,
        //             item: req.params.item,
        //             year: req.params.year
        //         })

    //     })


})
router.get('/year/:year/excel/:item/edit', function(req, res) {


    // console.log(req.session.user)
    var newhtml = ''
    if (req.params.item == 'Models') {
        newhtml = "edit.html"
    } else if (req.params.item == 'Group') {
        newhtml = "edit1.html"
    } else if (req.params.item == 'Action') {
        newhtml = "edit2.html"
    } else {
        newhtml = "edit3.html"
    }
    var form = fs.readFileSync('./views/' + newhtml, { encoding: "utf8" });

    if (req.params.item == "Models") {
        //res.send(req.params.id)
        Models.findById(req.query.id.replace(/"/g, ''), function(err, items) {
            if (err) {
                return res.status(500).send('server error')
            }



            var a = {
                _id: '',
                name: '',
                time: '',
                detail: '',
                others: '',

            }





            a.name = items.name
            a.time = items.time
            a.detail = items.detail
            a.others = items.others

            a._id = JSON.parse(JSON.stringify(items._id))



            res.render(newhtml, {
                user: req.session.user,
                items: a,
                item: "Models",

                year: req.params.year,

            })

        })
    }

    // res.render(newhtml, {
    //     user: req.session.user,
    //     items: student,
    //     item: "Models",
    //     year: req.params.year
    // })
    else if (req.params.item == "Coach") {
        //res.send(req.params.id)
        Coach.findById(req.query.id.replace(/"/g, ''), function(err, items) {
            if (err) {
                return res.status(500).send('server error')
            }

            var a = {
                _id: '',
                yuan: '',
                name: '',
                gender: '',
                others: '',

            }




            a.name = items.name
            a.yuan = items.yuan
            a.gender = items.gender
            a.others = items.others

            a._id = JSON.parse(JSON.stringify(items._id))


            res.render(newhtml, {
                user: req.session.user,
                items: a,
                item: "Coach",

                year: req.params.year,

            })

        })
    } else if (req.params.item == "Group") {
        //res.send(req.params.id)
        Group.findById(req.query.id.replace(/"/g, ''), function(err, items) {
            if (err) {
                return res.status(500).send('server error')
            }
            var a = {
                _id: '',
                name: '',
                class: '',
                gender: '',
                direct: '',

            }






            a.name = items.name
            a.class = items.class
            a.gender = items.gender
            a.direct = items.direct

            a._id = JSON.parse(JSON.stringify(items._id))


            res.render(newhtml, {
                user: req.session.user,
                items: a,
                item: 'Group',

                year: req.params.year,

            })

        })
    } else if (req.params.item == "Action") {
        //res.send(req.params.id)
        Action.findById(req.query.id.replace(/"/g, ''), function(err, items) {
            if (err) {
                return res.status(500).send('server error')
            }
            var a = {
                _id: '',
                name: '',
                time: '',
                message: '',
                result: '',

            }




            a.name = items.name
            a.time = items.time
            a.message = items.message
            a.result = items.result

            a._id = JSON.parse(JSON.stringify(items._id))


            res.render(newhtml, {
                user: req.session.user,

                items: a,
                item: 'Action',

                year: req.params.year,

            })

        })
    }



})
router.post('/year/:year/excel/:item/new', upload.array('logo', 10), function(req, res) {

    req.body.year = req.params.year
    var a = []
    for (var i = 0; i < req.files.length; i++) {
        a[i] = req.files[i].originalname
    }
    req.body.imgname = a




    var yearss = req.params.year.replace(/"/g, '')
        // console.log()
    if (req.params.item == "Models") {
        new Models(req.body).save(function(err) {
            if (err) {
                return res.status(500).send('server error')
            }
            res.redirect('/year/' + yearss + '/excel/Models')
        })
    } else if (req.params.item == "Group") {
        new Group(req.body).save(function(err) {
            if (err) {
                return res.status(500).send('server error')
            }
            res.redirect('/year/' + yearss + '/excel/Group')
        })
    } else if (req.params.item == "Action") {
        new Action(req.body).save(function(err) {
            if (err) {
                return res.status(500).send('server error')
            }
            res.redirect('/year/' + yearss + '/excel/Action')
        })
    } else if (req.params.item == "Coach") {
        new Coach(req.body).save(function(err) {
            if (err) {
                return res.status(500).send('server error')
            }
            res.redirect('/year/' + yearss + '/excel/Coach')
        })
    }




})

router.post('/year/:year/excel/:item/edit', upload.array('logo', 10), function(req, res) {

    var id = req.body.id.replace(/"/g, '')
    var a = []
    for (var i = 0; i < req.files.length; i++) {
        a[i] = req.files[i].originalname
    }
    req.body.imgname = a


    var yearss = req.params.year.replace(/"/g, '')
    if (req.params.item == "Models") {
        Models.findByIdAndUpdate(id, req.body, function(err) {
            if (err) {
                return res.status(500).send('Server error.')
            }
            res.redirect('/year/' + yearss + '/excel/Models')
        })
    } else if (req.params.item == "Group") {
        Group.findByIdAndUpdate(id, req.body, function(err) {
            if (err) {
                return res.status(500).send('Server error.')
            }
            res.redirect('/year/' + yearss + '/excel/Group')
        })
    } else if (req.params.item == "Action") {
        Action.findByIdAndUpdate(id, req.body, function(err) {
            if (err) {
                return res.status(500).send('Server error.')
            }
            res.redirect('/year/' + yearss + '/excel/Action')
        })
    } else if (req.params.item == "Coach") {
        Coach.findByIdAndUpdate(id, req.body, function(err) {
            if (err) {
                return res.status(500).send('Server error.')
            }
            res.redirect('/year/' + yearss + '/excel/Coach')
        })
    }
})

router.get('/year/:year/excel/:item/delete', function(req, res) {
    var id = req.query.id.replace(/"/g, '')
    var yearss = req.params.year.replace(/"/g, '')
    if (req.params.item == "Models") {


        Models.findByIdAndRemove(id, function(err) {
            if (err) {
                return res.status(500).send('Server error.')
            }
            res.redirect('/year/' + yearss + '/excel/Models')
        })
    } else if (req.params.item == "Group") {


        Group.findByIdAndRemove(id, function(err) {
            if (err) {
                return res.status(500).send('Server error.')
            }
            res.redirect('/year/' + yearss + '/excel/Group')
        })
    } else if (req.params.item == "Action") {


        Action.findByIdAndRemove(id, function(err) {
            if (err) {
                return res.status(500).send('Server error.')
            }
            res.redirect('/year/' + yearss + '/excel/Action')
        })
    } else if (req.params.item == "Coach") {


        Coach.findByIdAndRemove(id, function(err) {
            if (err) {
                return res.status(500).send('Server error.')
            }
            res.redirect('/year/' + yearss + '/excel/Coach')
        })
    }

})
router.post('/addyear', function(req, res) {
    //console.log(req.body)
    new Years(req.body).save(function(err) {
        if (err) {
            return res.status(500).send('server error')
        }
        res.redirect('/year/2017/excel/Models')
    })

})


module.exports = router