# Corporate Meeting Room Booking System - C237 CA2

## Project Overview

This repository contains the Continuous Assessment 2 (CA2) project for the C237 Software Application Development module. It is a fully functional web application designed to handle room bookings and user accounts.

## Team's Choice of Application Theme

Our team has chosen to develop a Corporate Meeting Room Booking System. 

We selected this theme because it solves a real problem in the workplace: the difficulty of finding and booking open meeting rooms. By keeping all schedules in one place, the application prevents double-booking and allows office staff to manage room availability easily.

## Target Users

The intended users for this application are:

* **Employees:** Staff who need a meeting space and want an easy way to view and book available time slots.
* **Office Staff:** Personnel responsible for managing daily office operations, checking room conditions, and handling feedback.
* **System Administrators:** IT staff who manage the system settings, database, and user accounts.

## Application Roles and Functions

To keep data secure, our application features three distinct user roles:

| User Role | Access Level | Key Functions and Permissions |
| :--- | :--- | :--- |
| **System Admin** | High | Can add brand-new meeting rooms, update system time limits, and create staff accounts. |
| **Office Staff** | Medium | Can view daily schedules, post announcements, mark empty rooms as "no-show", and update room conditions. |
| **Employee** | Standard | Can search for rooms, create or cancel their own bookings, send feedback, and join a room waitlist. |

## Team Responsibilities

**Member 1: Registration, Login & Accounts (Lwin)**
* **app.js:**
  * Write a GET route (like `/view-users`) for the Admin to see a list of all registered employees and staff.
  * Write a POST route (like `/register`) for new users to sign up and create an account.
  * Write a POST route (like `/login`) to check the username and password.
* **MySQL:**
  * Write a SELECT query to pull the user list, and to check if a password matches during login.
  * Write an INSERT query to save the new user's details during registration.
  * Write an UPDATE query for a "forgot password" feature.

**Member 2: Manage Rooms (Faris)**
* **app.js:**
  * Write a GET route (like `/view-rooms`) to display all meeting rooms and their conditions.
  * Write a POST route (like `/add-room`) for the Admin to add new meeting rooms.
  * Write a POST route (like `/update-room-status`) for Staff to change the room status.
* **MySQL:**
  * Write a SELECT query to fetch the list of rooms.
  * Write an INSERT query to add new rooms.
  * Write an UPDATE query to change the condition of a room.

**Member 3: Manage Bookings (Zaw)**
* **app.js:**
  * Write a GET route (like `/daily-schedule`) to show all bookings for the day.
  * Write a POST route (like `/create-booking`) for Employees to create new room bookings.
  * Write a POST route (like `/mark-no-show`) for Staff to free up an empty room.
* **MySQL:**
  * Write a SELECT query to pull today's schedule.
  * Write an INSERT query to save a new booking.
  * Write an UPDATE query to change a booking's status to "no-show".

**Member 4: Announcements & Feedback (Elisha)**
* **app.js:**
  * Write a GET route (like `/read-feedback`) for Staff to view all complaints or reviews.
  * Write a POST route (like `/post-announcement`) for Staff to post new announcements.
  * Write a POST route (like `/resolve-feedback`) for Staff to mark feedback as "Resolved".
* **MySQL:**
  * Write a SELECT query to pull all reviews.
  * Write an INSERT query to save announcements.
  * Write an UPDATE query to change the feedback status to resolved.

**Member 5: Cancel & Flags (Carissa)**
* **app.js:**
  * Write a GET route (like `/my-bookings`) to show an employee's future bookings.
  * Write a POST route (like `/cancel-booking`) for Employees to cancel their bookings.
  * Write a POST route (like `/add-misuse-flag`) for Staff to add a "Misuse Flag" to an employee.
* **MySQL:**
  * Write a SELECT query to fetch bookings for one specific user.
  * Write a DELETE query to remove a canceled booking.
  * Write an UPDATE query to add a penalty flag.

**Member 6: Enhancements (Khoon Yong)**
* **app.js:**
  * Write a GET route (like `/view-waitlist`) to show who is waiting for a room.
  * Write a POST route (like `/join-waitlist`) for Employees to join the room waitlist.
  * Write a POST route (like `/update-time-limit`) for the Admin to update system time limits.
* **MySQL:**
  * Write a SELECT query to fetch the waitlist.
  * Write an INSERT query to save an employee into the waitlist.
  * Write an UPDATE query to change the booking rules in the settings.

## Technology Stack

This project uses the following technologies:

* **Backend:** Node.js with Express
* **Frontend:** EJS (Embedded JavaScript templating)
* **Database:** MySQL (Full CRUD operations)

## Setup and Installation

1. Clone this repository to your local machine.
2. Run `npm install` to install all dependencies (Express, EJS, MySQL2, Express-Session, connect-flash).
3. Import the included `.sql` database file into your local MySQL server.
4. Update the database connection credentials in `server.js` (or `app.js`).
5. Run `node server.js` to start the application on `http://localhost:3000`.
