# Study Room Booking System - C237 CA2

## Project Overview

This repository contains the Continuous Assessment 2 (CA2) project for the C237 Software Application Development module. It is a fully functional web application designed to handle resource management and user access control.

## Team's Choice of Application Theme

Our team has chosen to develop a Study Room Booking System. This theme aligns with the event and activity management domain.

We selected this application theme because it addresses a genuine user problem on campus: the difficulty of efficiently locating and securing open study spaces. By centralizing room schedules, the application prevents double-booking conflicts and allows campus staff to manage room availability in real-time.

## Target Users

The intended users for this application are:

* **Students:** Individuals who need a quiet space to study or collaborate and require an easy way to view available time slots.
* **Librarians and Campus Staff:** Personnel responsible for overseeing the daily operations of the campus library or study halls.
* **System Administrators:** IT staff who manage the overarching system infrastructure, database integrity, and user access levels.

## Application Roles and Functions

To ensure secure access control and data management, our application features three distinct user roles with varying permissions:

| User Role | Access Level | Key Functions and Permissions |
| :--- | :--- | :--- |
| **System Admin** | High | Can add brand-new study rooms to the system, permanently delete retired rooms, and manage all user accounts and roles. |
| **Librarian (Staff)** | Medium | Can view all daily bookings, cancel student no-shows, and update a room's physical status (e.g., marking a room as "Out of Order"). |
| **Regular Student** | Standard | Can search for available rooms, create new bookings, view their personalized dashboard, and cancel their own bookings. |

## Technology Stack

This project demonstrates core skills learned in class, built using the following technologies:

* **Backend:** Node.js with Express


* **Frontend:** EJS (Embedded JavaScript templating)


* **Database:** MySQL (Full CRUD operations)



## Setup and Installation

1. Clone this repository to your local machine.
2. Run `npm install` to install all dependencies (Express, EJS, MySQL2, Express-Session, connect-flash).
3. Import the included `.sql` database file into your local MySQL server.


4. Update the database connection credentials in `server.js` (or `app.js`).
5. Run `node server.js` to start the application on `http://localhost:3000`.

---

*Documentation updated prior to the Monday milestone to reflect final theme and role selections.*
