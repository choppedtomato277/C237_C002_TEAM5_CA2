const express = require('express');
const mysql = require('mysql2');
const app = express();
const session = require('express-session');
const flash = require('connect-flash');

// Database 
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

app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

// Setting up EJS & Flash
app.set('view engine', 'ejs');
app.use(flash());

// Setting up session 
app.use(session({
    secret: 'secret',
    resave: false, 
    saveUninitialized: true, 
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

// Auth Middlewares
const checkAuthenticated = (req, res, next) => {
    if (req.session.user) { 
        next();
    } else {
        req.flash('error', 'Session Timed Out! Please Login again!');
        res.redirect('/login');
    }
};

const checkAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        req.flash('error', 'Access is Denied, If you are an Admin, Please use an Admin account to access this resource!');
        res.redirect('/');
    }
};

// Check if user is Staff or Admin
const checkStaffOrAdmin = (req, res, next) => {
    if (req.session.user && (req.session.user.role === 'staff' || req.session.user.role === 'admin')) {
        next();
    } else {
        req.flash('error', 'Access Denied: Staff or Admin permission required.');
        res.redirect('/view-rooms');
    }
};

// Homepage
app.get('/', (req, res) => {
    res.render('partials/index', { user: req.session.user, error: req.flash('error'), success: req.flash('success') });
}); 

// ==========================================
// WAITLIST ROUTES (TEAMMATE FEATURE)
// ==========================================
const ACTIVE_WAITING_VALUE = '1';
const ACTIVE_CANCELLED_VALUE = '0';
const MAX_WAITLIST_SIZE = 3;

const getWaitlistDetails = (source) => {
    const { room_id, booking_date, time_slot_id } = source;
    if (!room_id || !booking_date || !time_slot_id) return null;
    return { room_id, booking_date, time_slot_id };
};

app.get('/view-waitlist', checkAuthenticated, (req, res) => {
    const canViewAllWaitlists = ['staff', 'admin'].includes(req.session.user.role);
    let sql = `
        SELECT waitlist_id, waitlist_booking_date, time_slot_id, room_id, email
        FROM waiting_list
        WHERE is_waiting = ?
          AND is_cancelled = ?`;
    const queryValues = [ACTIVE_WAITING_VALUE, ACTIVE_CANCELLED_VALUE];

    if (!canViewAllWaitlists) {
        sql += ' AND email = ?';
        queryValues.push(req.session.user.email);
    }

    sql += ' ORDER BY waitlist_booking_date ASC, time_slot_id ASC, waitlist_id ASC';

    db.query(sql, queryValues, (error, rows) => {
        if (error) {
            console.error('Unable to view waitlist:', error);
            req.flash('error', 'Unable to retrieve the waitlist.');
            return res.redirect('/');
        }

        res.render('view_waitlist', {
            user: req.session.user,
            waitlist: rows,
            viewingAll: canViewAllWaitlists
        });
    });
});

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

// ==========================================
// REGISTRATION & AUTH ROUTES
// ==========================================
const validateRegistration = (req, res, next) => {
    const { email, name, password, role } = req.body;

    if (!email || !name || !password || !role) {
        req.flash('error', 'All Fields are required!');
        req.flash('formData', req.body);
        return res.send('All fields are required!');
    } 

    if (password.length < 8) {
        req.flash('error', 'Password should be at least 8 characters!');
        req.flash('formData', req.body);
        return res.redirect('/register');
    }

    next();
};

app.get('/register', (req, res) => {
    res.render('registration_page', { message: req.flash('error'), formData: req.flash('formData') });
});

app.post('/register', validateRegistration, (req, res) => {
    const { email, name, password, role } = req.body;
    const created_time = new Date();
    
    const checkSql = 'SELECT email FROM users WHERE email = ?';
    db.query(checkSql, [email], (checkError, checkResults) => {
        if (checkError) throw checkError;
        
        if (checkResults.length > 0) {
            req.flash('error', 'Email already registered!');
            return res.redirect('/register');
        }
        
        const sql = 'INSERT INTO users (email, name, password, role, created_at) VALUES (?,?,SHA1(?),?,?)';
        db.query(sql, [email, name, password, role, created_time], (error, results) => {
            if (error) throw error;
            req.flash('success', 'Registration successful! Please log in.');
            res.redirect('/login');
        });
    });
});

app.get('/request-admin_access', checkAuthenticated, (req, res) => {
    res.render('request_admin_access_form', { user: req.session.user });
});

app.post('/request-admin_access', checkAuthenticated, (req, res) => {
    const reason = req.body.reason;
    const sql = 'INSERT INTO admin_requests (reason, email, status, requested_at) VALUES (?, ?, "pending", NOW())';
    db.query(sql, [reason, req.session.user.email], (error, results) => {
        if (error) {
            throw error;
        } else {
            req.flash('success', 'The request has been successfully submitted.');
            res.redirect('/');
        }
    });
});

app.get('/login', (req, res) => {
    res.render('login_page', { message: req.flash('success'), error: req.flash('error') });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = "SELECT * FROM users WHERE email = ? AND password = SHA1(?)";

    if (!email || !password) {
        req.flash('error', 'All field are required!');
        res.redirect('/login');
    }

    db.query(sql, [email, password], (error, results) => {
        if (error) throw error;
        
        if (results.length > 0) {
            req.session.user = results[0];
            req.flash('success', 'Login Successful!');
            res.redirect('/');
        } else {
            req.flash('error', 'Invalid email or password.');
            res.redirect('/login');
        }
    });
});

app.get('/view_users', checkAdmin, (req, res) => {
    const sql = 'SELECT * FROM users';
    db.query(sql, (error, results) => {
        if (error) throw error;
        res.render('view_users', { user: req.session.user, users: results });
    });
});

app.get('/manage_admin_access_requests', checkAdmin, (req, res) => {
    const sql = 'SELECT * FROM admin_requests ORDER BY requested_at DESC';
    db.query(sql, (error, results) => {
        if (error) throw error;
        res.render('manage_admin_access_requests', { user: req.session.user, requests: results });
    });
});

app.post('/admin_access_requests/:id/approve', checkAdmin, (req, res) => {
    const { id } = req.params;
    const reviewed_by = req.session.user.email;
    
    const getSql = 'SELECT email FROM admin_requests WHERE id = ?';
    db.query(getSql, [id], (getError, getResults) => {
        if (getError) throw getError;
        if (getResults.length === 0) {
            req.flash('error', 'Request not found.');
            return res.redirect('/manage_admin_access_requests');
        }
        
        const requestEmail = getResults[0].email;
        const updateRequestSql = 'UPDATE admin_requests SET status = "approved", reviewed_at = NOW(), reviewed_by = ? WHERE id = ?';
        
        db.query(updateRequestSql, [reviewed_by, id], (error, results) => {
            if (error) throw error;
            const updateUserSql = 'UPDATE users SET role = "admin" WHERE email = ?';
            db.query(updateUserSql, [requestEmail], (userError, userResults) => {
                if (userError) throw userError;
                req.flash('success', 'Request has been approved.');
                res.redirect('/manage_admin_access_requests');
            });
        });
    });
});

app.post('/admin_access_requests/:id/reject', checkAdmin, (req, res) => {
    const { id } = req.params;
    const reviewed_by = req.session.user.email;
    const sql = 'UPDATE admin_requests SET status = "rejected", reviewed_at = NOW(), reviewed_by = ? WHERE id = ?';
    db.query(sql, [reviewed_by, id], (error, results) => {
        if (error) throw error;
        req.flash('success', 'Request has been rejected.');
        res.redirect('/manage_admin_access_requests');
    });
});

// ==========================================
// MEMBER 2: MANAGE ROOMS (FARIS)
// ==========================================

app.get('/dashboard', (req, res) => {
    res.redirect('/view-rooms');
});

app.get('/view-rooms', checkAuthenticated, (req, res) => {
    const sql = 'SELECT * FROM study_rooms';
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching rooms:', err);
            req.flash('error', 'Database error fetching rooms.');
            return res.redirect('/');
        }
        
        res.render('view-rooms', { 
            user: req.session.user, 
            rooms: results,
            success: req.flash('success'),
            error: req.flash('error')
        });
    });
});

app.get('/add-room', checkAdmin, (req, res) => {
    res.render('add-room', { 
        user: req.session.user,
        error: req.flash('error')
    });
});

app.post('/add-room', checkAdmin, (req, res) => {
    const { room_id, room_name, capacity, has_whiteboard, has_projector } = req.body;

    if (!room_id || !room_name || parseInt(capacity) <= 0) {
        req.flash('error', 'Invalid Room ID, name, or capacity!');
        return res.redirect('/add-room');
    }

    const sql = 'INSERT INTO study_rooms (room_id, room_name, capacity, has_whiteboard, has_projector) VALUES (?, ?, ?, ?, ?)';
    
    db.query(sql, [
        room_id, 
        room_name, 
        capacity, 
        has_whiteboard ? 1 : 0, 
        has_projector ? 1 : 0
    ], (err, result) => {
        if (err) {
            console.error('Error adding room:', err);
            req.flash('error', 'Database error: Could not add room.');
            return res.redirect('/add-room');
        }

        req.flash('success', `Room '${room_name}' added successfully!`);
        res.redirect('/view-rooms');
    });
});

app.post('/update-room-status', checkStaffOrAdmin, (req, res) => {
    const { room_id, condition_status } = req.body;

    const sql = 'UPDATE study_rooms SET condition_status = ? WHERE room_id = ?';
    db.query(sql, [condition_status, room_id], (err, result) => {
        if (err) {
            console.error('Error updating status:', err);
            req.flash('error', 'Database error: Could not update status.');
            return res.redirect('/view-rooms');
        }

        req.flash('success', `Room status updated to '${condition_status}'!`);
        res.redirect('/view-rooms');
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server started at: http://localhost:${PORT}`);
});