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
        next() // like continue in python
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


//end of checking roles and sessions (LWIN HTOO MYAT)


//
/* start of homepage (LWIN HTOO MYAT)
still have to implement the routing according to the logged in role
maybe use if else statement to render different "home pages" based on the role
if (req.session.user.role === 'admin'){
  res.render('partials/admin_page', {user: req.session.user})
};
OR we can use if else statements inside the index.ejs itself, 
which i think would be more efficient to implement, 
bec of the fact that we will need less ejs files that way */
app.get('/', (req, res) => {
    res.render('partials/index', {user: req.session.user, error: req.flash('error'), success: req.flash('success')})
}); 
//end of homepage (LWIN HTOO MYAT)

// Waitlist routes
// The database creates the waitlist automatically: inserting the first waiting
// row for a room/date/time-slot starts it.  The live schema uses is_waiting.
const ACTIVE_WAITING_VALUE = '1';
const ACTIVE_CANCELLED_VALUE = '0';
const MAX_WAITLIST_SIZE = 3;

const getWaitlistDetails = (source) => {
    const { room_id, booking_date, time_slot_id } = source;

    if (!room_id || !booking_date || !time_slot_id) {
        return null;
    }

    return { room_id, booking_date, time_slot_id };
};

// View only active entries for one room, date and time slot.
app.get('/view-waitlist', (req, res) => {
    const details = getWaitlistDetails(req.query);
    if (!details) {
        return res.status(400).json({ error: 'room_id, booking_date and time_slot_id are required.' });
    }

    const sql = `
        SELECT waitlist_id, waitlist_booking_date, time_slot_id, room_id, email
        FROM waiting_list
        WHERE room_id = ?
          AND DATE(waitlist_booking_date) = DATE(?)
          AND time_slot_id = ?
          AND is_waiting = ?
          AND is_cancelled = ?
        ORDER BY waitlist_id ASC`;

    db.query(sql, [
        details.room_id,
        details.booking_date,
        details.time_slot_id,
        ACTIVE_WAITING_VALUE,
        ACTIVE_CANCELLED_VALUE
    ], (error, rows) => {
        if (error) {
            console.error('Unable to view waitlist:', error);
            return res.status(500).json({ error: 'Unable to retrieve the waitlist.' });
        }

        res.json({ waitlist: rows });
    });
});

// Join a waitlist. The booking flow should call this only after it has found
// that the requested room/slot is full.
app.post('/join-waitlist', (req, res) => {
    const details = getWaitlistDetails(req.body);
    const email = req.session.user?.email || req.body.email;

    if (!details || !email) {
        return res.status(400).json({ error: 'room_id, booking_date, time_slot_id and email are required.' });
    }

    const activeWaitlistSql = `
        SELECT waitlist_id, email
        FROM waiting_list
        WHERE room_id = ?
          AND DATE(waitlist_booking_date) = DATE(?)
          AND time_slot_id = ?
          AND is_waiting = ?
          AND is_cancelled = ?`;

    db.query(activeWaitlistSql, [
        details.room_id,
        details.booking_date,
        details.time_slot_id,
        ACTIVE_WAITING_VALUE,
        ACTIVE_CANCELLED_VALUE
    ], (error, rows) => {
        if (error) {
            console.error('Unable to check waitlist:', error);
            return res.status(500).json({ error: 'Unable to join the waitlist.' });
        }

        if (rows.some((row) => row.email === email)) {
            return res.status(409).json({ error: 'You are already on this waitlist.' });
        }

        if (rows.length >= MAX_WAITLIST_SIZE) {
            return res.status(409).json({ error: 'This waitlist is full (maximum 3 people).' });
        }

        const insertSql = `
            INSERT INTO waiting_list
                (waitlist_booking_date, time_slot_id, room_id, email, is_waiting, is_cancelled)
            VALUES (?, ?, ?, ?, ?, ?)`;

        db.query(insertSql, [
            details.booking_date,
            details.time_slot_id,
            details.room_id,
            email,
            ACTIVE_WAITING_VALUE,
            ACTIVE_CANCELLED_VALUE
        ], (insertError, result) => {
            if (insertError) {
                console.error('Unable to join waitlist:', insertError);
                return res.status(500).json({ error: 'Unable to join the waitlist.' });
            }

            res.status(201).json({
                message: 'Joined the waitlist.',
                waitlist_id: result.insertId
            });
        });
    });
});

// Keep the row for audit/history, but remove it from the active waitlist.
app.post('/cancel-waitlist', (req, res) => {
    const { waitlist_id } = req.body;
    const email = req.session.user?.email || req.body.email;

    if (!waitlist_id || !email) {
        return res.status(400).json({ error: 'waitlist_id and email are required.' });
    }

    const sql = `
        UPDATE waiting_list
        SET is_cancelled = ?
        WHERE waitlist_id = ?
          AND email = ?
          AND is_waiting = ?
          AND is_cancelled = ?`;

    db.query(sql, [
        '1',
        waitlist_id,
        email,
        ACTIVE_WAITING_VALUE,
        ACTIVE_CANCELLED_VALUE
    ], (error, result) => {
        if (error) {
            console.error('Unable to cancel waitlist entry:', error);
            return res.status(500).json({ error: 'Unable to cancel the waitlist entry.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Active waitlist entry not found.' });
        }

        res.json({ message: 'Waitlist entry cancelled.' });
    });
});

//registration routes (LWIN HTOO MYAT)
const validateRegistration = (req, res, next) => {
    const {email, name, password, role} = req.body

    if (!email || !name ||!password ||!role) {
        req.flash('error', 'All Fields are required!')
        req.flash('formData', req.body)
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
    res.render('registration_page', 
    {message: req.flash('error'), formData: req.flash('formData')})
});

app.post('/register', validateRegistration, (req, res) => {
    const { email, name, password, role } = req.body
    const created_time = new Date() // Use JavaScript Date instead of now()
    
    // First check if email already exists
    const checkSql = 'SELECT email FROM users WHERE email = ?'
    db.query(checkSql, [email], (checkError, checkResults) => {
        if (checkError) throw checkError
        
        if (checkResults.length > 0) {
            req.flash('error', 'Email already registered!')
            return res.redirect('/register')
        }
        
        const sql = 'INSERT INTO users (email, name, password, role, created_at) VALUES (?,?,SHA1(?),?,?)'
        db.query(sql, [email, name, password, role, created_time], (error, results) => {
            if (error) throw error
            console.log(results)
            req.flash('success', 'Registration successful! Please log in.')
            res.redirect('/login')
        })
    })
})
//end of registration routes (LWIN HTOO MYAT)


//start of requesting admin access (LWIN HTOO MYAT)
app.get('/request-admin_access',checkAuthenticated, (req, res)=>{
    res.render('request_admin_access_form', {user: req.session.user})
})

app.post('/request-admin_access',checkAuthenticated, (req, res) =>{
    const reason = req.body.reason

    const sql = 'INSERT INTO admin_requests (reason, email, status, requested_at) VALUES (?, ?, "pending", NOW())'
    db.query(sql, [reason, req.session.user.email], (error, results)=>{
        if (error){
            throw error
        } else {
            req.flash('success', 'The request has been successfully submitted.')
            res.redirect('/', )
        }
    })
})
//end of requeseting admin  access (LWIN HTOO MYAT)


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
            res.redirect('/') //to the main page
        } else {
            // Invalid credentials
            req.flash('error', 'Invalid email or password.');
            res.redirect('/login');
        }
    })
});

//end of the login routes (LWIN HTOO MYAT)


//start of view_users route (LWIN HTOO MYAT)
app.get('/view_users', checkAdmin, (req, res, next) => {
    const sql = 'SELECT * FROM users'
    db.query(sql, (error, results)=>{
        if (error){
            throw error
        } else {
            res.render('view_users', {user: req.session.user, users: results})
        }
    })
})

//end of view_users route


//start of manage admin access requests route (LWIN HTOO MYAT)
app.get('/manage_admin_access_requests', checkAdmin, (req, res) => {
    const sql = 'SELECT * FROM admin_requests ORDER BY requested_at DESC'
    db.query(sql, (error, results) => {
        if (error) {
            throw error
        } else {
            res.render('manage_admin_access_requests', { user: req.session.user, requests: results }) //this aldy includes id
        }
    })
})

app.post('/admin_access_requests/:id/approve', checkAdmin, (req, res) => {
    const { id } = req.params
    const reviewed_by = req.session.user.email
    
    // First get the email from the admin request
    const getSql = 'SELECT email FROM admin_requests WHERE id = ?'
    db.query(getSql, [id], (getError, getResults) => {
        if (getError) throw getError
        
        if (getResults.length === 0) {
            req.flash('error', 'Request not found.')
            return res.redirect('/manage_admin_access_requests')
        }
        
        const requestEmail = getResults[0].email
        
        // Update the admin_requests table
        const updateRequestSql = 'UPDATE admin_requests SET status = "approved", reviewed_at = NOW(), reviewed_by = ? WHERE id = ?'
        db.query(updateRequestSql, [reviewed_by, id], (error, results) => {
            if (error) throw error
            
            // Update the user's role in the users table
            const updateUserSql = 'UPDATE users SET role = "admin" WHERE email = ?'
            db.query(updateUserSql, [requestEmail], (userError, userResults) => {
                if (userError) throw userError
                
                req.flash('success', 'Request has been approved.')
                res.redirect('/manage_admin_access_requests')
            })
        })
    })
})

app.post('/admin_access_requests/:id/reject', checkAdmin, (req, res) => {
    const { id } = req.params
    const reviewed_by = req.session.user.email
    const sql = 'UPDATE admin_requests SET status = "rejected", reviewed_at = NOW(), reviewed_by = ? WHERE id = ?'
    db.query(sql, [reviewed_by, id], (error, results) => {
        if (error) {
            throw error
        } else {
            req.flash('success', 'Request has been rejected.')
            res.redirect('/manage_admin_access_requests')
        }
    })
})
//end of manage admin access requests route (LWIN HTOO MYAT)


app.listen(3000, () => {
    console.log('Server started on port 3000');
});
