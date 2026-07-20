const express = require('express');
const mysql = require('mysql2');
const app = express();
const session = require('express-session')
const flash = require('connect-flash')

//database 
const db = mysql.createConnection({
    host: 'c237-marlina-mysql.Mysql.database.azure.com',
    user: 'c237_002',
    password: 'c237002@2026!',
    database: 'c237_002_team5_study_room_db',
    ssl: {
        rejectUnauthorized: false,
    },
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to database');
});

app.use(express.urlencoded({ extended: false })); // to manipulate the url and get form data
app.use(express.static('public'));

// Setting up EJS
app.set('view engine', 'ejs');
app.use(flash()); // setup flash

//setting up session 
app.use(session({
    secret: 'secret',
    resave: false, 
    saveUninitialized: true, 
    //session expire after one week of inactivity
    cookie: {maxAge: 7 * 24 * 60 * 60 * 1000} //1000 = milliseconds
}))
// end of setting up session 


//Lwin Htoo Myat
//define functions to check whether the user is already authenticated or not, if not redirect to the login page
const checkAuthenticated = (req, res, next) => {
    if (req.session.user) { 
        next()
    } else {
        req.flash('error', 'Session Timed Out! Please Login again!') 
        res.redirect('/login')
    }
}

const checkAdmin = (req, res, next) => {
    if (req.session.user.role === 'admin'){  // all lowercase because we gave the user all lower case values in the registration form
        next()
    } else {
        req.flash('error', 'Access is Denied, If you are an Admin, Please use an Admin account to access this resource!')
        res.redirect('/') // to be updated
    }
}

const checkStaff = (req, res, next) => {
    if (req.session.user.role === 'staff'){  // all lowercase because we gave the user all lower case values in the registration form
        next()
    } else {
        req.flash('error', 'Access is Denied, If you are a Staff, Please use a Staff account to access this resource!')
        res.redirect('/') // to be updated
    }
}

//end of checking roles and sessions (LWIN HTOO MYAT)



//start of homepage (LWIN HTOO MYAT)
//still have to implement the routing according to the logged in role
app.get('/', (req, res) => {
    res.render('partials/index', {user: req.session.user})
});
//end of homepage (LWIN HTOO MYAT)


//registration routes (LWIN HTOO MYAT)
const validateRegistration = (req, res, next) => {
    const {email, name, password, role} = req.body

    if (!email || !name ||!password ||!role) {
        return res.send('All fields are required!')
    } 

    if (password.length < 8) {
        req.flash('error', 'Password should be at least 8 characters!')
        req.flash('formData', req.body)
        return res.redirect('/register')
    }

    next()
}

app.get('/register', (req, res) => { //we are passing in message: req.flash etc... to keep the data and rediret the user to the register page with the form data
    res.render('registration_page', {message: req.flash('error'), formData: req.flash('formData')})
});

app.post('/register', validateRegistration,(req, res) => {
    const {email, name, password, role} = req.body

    const sql = 'INSERT INTO users (email, name, password, role) VALUES (?,?,SHA1(?),?)'
    db.query(sql, [email, name, password, role], (error, results) =>{
        if (error) {
            throw error
        }
        console.log(results)
        req.flash('success', 'Registration successful! Please log in.')
        res.redirect('/login')
    })
})
//end of registration routes (LWIN HTOO MYAT)



//start of the login routes (LWIN HTOO MYAT)
app.get('/login', (req, res) => {
    res.render('login_page', { message: req.flash('success'), error: req.flash('error') })
})


app.post('/login', (req,res)=>{
    const {email, password} = req.body
    const sql = "SELECT * FROM users WHERE email = ? AND password = SHA1(?)"

    if (!email || !password) {
        req.flash('error', 'All field are required!')
        res.redirect('/login')
    };

    db.query(sql, [email, password], (error, results) => {
        if (error) {
            throw error
        } 
        if (results.length > 0) { // if there is a user with the valid credentials inside the database store them in the req.session.user
            req.session.user = results[0] // results[0] because "results" itself is an array, it not later have to access req.session.user[0].role to check the role
            req.flash('success', 'Login Successful!')
            res.redirect('/') //to be updated later
        } else {
            // Invalid credentials
            req.flash('error', 'Invalid email or password.');
            res.redirect('/login');
        }
    })
});

//end of the login routes (LWIN HTOO MYAT)


app.listen(3000, () => {
    console.log('Server started on port 3000');
});
