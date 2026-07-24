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
        res.redirect('/') // UPDATED: redirect to home page for non-admins
    }
}

const checkStaff = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'staff'){
        next()
    } else {
        req.flash('error', 'Access is Denied. Staff only.')
        res.redirect('/')
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
        
        const sql = 'INSERT INTO users (email, name, password, role, created_at, misuse_flag) VALUES (?,?,SHA1(?),?,?,?)'
        db.query(sql, [email, name, password, role, created_time, 0], (error, results) => {
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
            // UPDATED: Redirect based on user role - align with Carissa's pages
            if (req.session.user.role === 'employee') {
                res.redirect('/my-bookings')  // Carissa's page for employees
            } else if (req.session.user.role === 'staff') {
                res.redirect('/staff-dashboard')  // Carissa's page for staff
            } else {
                res.redirect('/')  // admin and others go to home
            }
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


// ============================================================
// START OF CARISSA SECTION - Study Room Booking App Features
// ============================================================

/* 
   CHANGES MADE TO INTEGRATE WITH MAIN APP DATABASE:
   - Changed user_id to email (since email is the PK in users table)
   - Changed employee_id to email (since bookings table uses email FK)
   - Removed start_time from ORDER BY (bookings use time_slot_id instead)
   - misuse_flag already exists in users table - no change needed
   - Added JOIN with time_slots and rooms tables for full booking info
   - Changed cancel to UPDATE status='cancelled' instead of DELETE
*/

// TEMPORARY test employee login (CARISSA)
app.get("/test-login", (req, res) => {
  req.session.user = {
    email: "test@employee.com",  // CHANGED: using email instead of user_id
    role: "employee"
  };

  res.send("Test employee login successful. Now go to /my-bookings");
});

// Employee views their own future bookings (CARISSA)
app.get("/my-bookings", (req, res) => {
  const user = req.session.user;

  if (!user || user.role !== "employee") {
    return res.status(403).send("Only employees can view this page.");
  }

  // UPDATED: Using correct column names - timeslot_id (not time_slot_id), JOIN with time_slots and rooms
  const sql = `
    SELECT b.*, t.start_time, t.end_time, r.room_name
    FROM bookings b
    LEFT JOIN timeslots t ON b.time_slot_id = t.timeslot_id
    LEFT JOIN study_rooms r ON b.room_id = r.room_id
    WHERE b.email = ?
    AND b.booking_date >= CURDATE()
    AND b.status = 'confirmed'
    ORDER BY b.booking_date ASC, t.start_time ASC
  `;

  db.query(sql, [user.email], (err, bookings) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Could not load bookings.");
    }

    res.render("my-bookings", { user: req.session.user, bookings });
  });
});

// Employee cancels one of their own future bookings (CARISSA)
app.post("/cancel-booking", (req, res) => {
  const user = req.session.user;
  const bookingId = req.body.booking_id;

  if (!user || user.role !== "employee") {
    return res.status(403).send("Only employees can cancel bookings.");
  }

  // CHANGED: Using email instead of employee_id, SET status to cancelled instead of DELETE
  const sql = `
    UPDATE bookings
    SET status = 'cancelled'
    WHERE booking_id = ?
      AND email = ?
      AND booking_date >= CURDATE()
      AND status = 'confirmed'
  `;

  db.query(sql, [bookingId, user.email], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Could not cancel booking.");
    }

    if (result.affectedRows === 0) {
      return res.send("Booking was not found or cannot be cancelled.");
    }

    res.redirect("/my-bookings");
  });
});

// TEMPORARY test staff login (CARISSA)
app.get("/test-staff-login", (req, res) => {
  req.session.user = {
    email: "test@staff.com",  // CHANGED: using email instead of user_id
    role: "staff"
  };

  res.send("Test staff login successful. Now go to /staff-dashboard");
});

// Staff page: show all employees (CARISSA)
app.get("/staff-dashboard", checkStaff, (req, res) => {
  const user = req.session.user;

  if (!user || user.role !== "staff") {
    return res.status(403).send("Only staff can view this page.");
  }

  // CHANGED: Using email as the identifier instead of user_id
  const sql = `
    SELECT email, name, misuse_flag
    FROM users
    WHERE role = 'employee'
  `;

  db.query(sql, (err, employees) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Could not load employees.");
    }

    res.render("staff-dashboard", { user: req.session.user, employees });
  });
});

// Staff adds one misuse flag to an employee (CARISSA)
app.post("/add-misuse-flag", checkStaff, (req, res) => {
  const user = req.session.user;
  const employeeEmail = req.body.email;  // CHANGED: Using email instead of employee_id

  if (!user || user.role !== "staff") {
    return res.status(403).send("Only staff can add misuse flags.");
  }

  // CHANGED: Using email as the identifier instead of user_id
  const sql = `
    UPDATE users
    SET misuse_flag = misuse_flag + 1
    WHERE email = ?
    AND role = 'employee'
  `;

  db.query(sql, [employeeEmail], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Could not add misuse flag.");
    }

    if (result.affectedRows === 0) {
      return res.send("Employee not found.");
    }

    res.redirect("/staff-dashboard");
  });
});

// END OF CARISSA SECTION
// ============================================================


// Logout route (LWIN HTOO MYAT - ADDED)
// UPDATED: Added logout functionality - destroys session and redirects to login
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/login');
    });
});


app.listen(3000, () => {
    console.log('Server started on port 3000');
});
