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



app.get('/', (req, res) => {
    res.render('partials/index')
});

//registration routes
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
    db.query(sql, [email, name, password, role], (error, result) =>{
        if (error) {
            throw error
        }
        console.log(result)
        req.flash('success', 'Registration successful! Please log in.')
        res.redirect('/login')
    })
})
//end of registration routes


// Starting the server
app.listen(3000, () => {
    console.log('Server started on port 3000');
});
