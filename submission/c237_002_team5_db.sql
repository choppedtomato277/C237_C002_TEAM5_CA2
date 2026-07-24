-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: c237-marlina-mysql.Mysql.database.azure.com    Database: c237_002_team5_study_room_db
-- ------------------------------------------------------
-- Server version	8.0.44-azure

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin_requests`
--

DROP TABLE IF EXISTS `admin_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(45) NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL,
  `requested_at` datetime NOT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `reviewed_by` varchar(45) DEFAULT NULL,
  `reason` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_admin_requests_users1_idx` (`email`),
  CONSTRAINT `fk_admin_requests_users1` FOREIGN KEY (`email`) REFERENCES `users` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_requests`
--

LOCK TABLES `admin_requests` WRITE;
/*!40000 ALTER TABLE `admin_requests` DISABLE KEYS */;
INSERT INTO `admin_requests` VALUES (1,'staff1@gmail.com','approved','2026-07-22 13:40:22','2026-07-22 13:42:32','admin1@gmail.com','test1\r\n'),(2,'staff1@gmail.com','approved','2026-07-22 13:40:26','2026-07-22 13:41:12','admin1@gmail.com','test2'),(3,'employee1@gmail.com','rejected','2026-07-22 14:16:51','2026-07-22 14:17:07','admin1@gmail.com','please'),(4,'employee1@gmail.com','rejected','2026-07-22 14:48:33','2026-07-22 14:57:30','admin1@gmail.com','PLEASE :( '),(8,'employee1@gmail.com','pending','2026-07-24 13:02:25',NULL,NULL,'please i need this');
/*!40000 ALTER TABLE `admin_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookings` (
  `booking_id` varchar(67) NOT NULL,
  `booking_date` date DEFAULT NULL,
  `time_slot_id` int DEFAULT NULL,
  `room_id` varchar(67) NOT NULL,
  `email` varchar(45) NOT NULL,
  `status` varchar(20) DEFAULT 'confirmed',
  PRIMARY KEY (`booking_id`),
  KEY `fk_booking_study_rooms_idx` (`room_id`),
  KEY `fk_booking_users1_idx` (`email`),
  CONSTRAINT `fk_booking_study_rooms` FOREIGN KEY (`room_id`) REFERENCES `study_rooms` (`room_id`),
  CONSTRAINT `fk_booking_users1` FOREIGN KEY (`email`) REFERENCES `users` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` VALUES ('3','2026-07-24',4,'R001','employee1@gmail.com','no-show'),('3345','2026-07-23',3,'R001','staff1@gmail.com','confirmed'),('8888','2026-07-23',1,'R001','staff1@gmail.com','confirmed'),('BK1784888773050','2026-07-25',3,'R004','staff1@gmail.com','confirmed'),('BK1784888791275','2026-07-24',3,'R004','staff1@gmail.com','confirmed'),('BK1784899626707','2026-07-25',11,'R004','employee@test.com','confirmed');
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `review_id` int NOT NULL AUTO_INCREMENT,
  `user_email` varchar(255) NOT NULL,
  `room_id` varchar(67) DEFAULT NULL,
  `review_score` int DEFAULT NULL,
  `review` varchar(255) DEFAULT NULL,
  `review_date` date DEFAULT NULL,
  PRIMARY KEY (`review_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
INSERT INTO `reviews` VALUES (3,'employee1@gmail.com','R003',1,'The quick brown fox jumps over the lazy dog.','2026-07-24'),(4,'employee1@gmail.com','R001',5,'Very long text to check somethingVery long text to check somethingVery long text to check somethingVery long text to check somethingVery long text to check somethingVery long text to check somethingVery long text to check somethingVery long text to check','2026-07-24'),(7,'employee1@gmail.com','R001',1,'test','2026-07-24'),(8,'employee@test.com','R004',5,'IT WAS REALLY GOOD THE AC IS COOL ENOUGH BUT NOT TOO MUCH SO THAT I CAN JUST COMFORTABLY CONDUCT THE MEETING, I DO LIKE THE AUTOMATIC AC SYSTEM WHERE THE AC AUTOMATICALLY GETS COOLER AS THE NUMBER OF PPLS INCREASES INSIDE THE ROOM REALLY NICE REALLY RECOM','2026-07-24');
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `study_rooms`
--

DROP TABLE IF EXISTS `study_rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `study_rooms` (
  `room_id` varchar(67) NOT NULL,
  `room_name` varchar(45) NOT NULL,
  `capacity` varchar(45) NOT NULL,
  `has_whiteboard` tinyint NOT NULL,
  `has_projector` tinyint NOT NULL,
  `condition_status` varchar(50) DEFAULT 'Available',
  PRIMARY KEY (`room_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `study_rooms`
--

LOCK TABLES `study_rooms` WRITE;
/*!40000 ALTER TABLE `study_rooms` DISABLE KEYS */;
INSERT INTO `study_rooms` VALUES ('R001','Test Room A','4',1,1,'Under Maintenance'),('R003','Conference Room W','4',0,1,'Disabled'),('R004','Room B','4',0,1,'Available');
/*!40000 ALTER TABLE `study_rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `timeslots`
--

DROP TABLE IF EXISTS `timeslots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `timeslots` (
  `timeslot_id` int NOT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  PRIMARY KEY (`timeslot_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `timeslots`
--

LOCK TABLES `timeslots` WRITE;
/*!40000 ALTER TABLE `timeslots` DISABLE KEYS */;
INSERT INTO `timeslots` VALUES (1,'09:00:00','11:00:00'),(2,'11:00:00','13:00:00'),(3,'13:00:00','15:00:00'),(4,'15:00:00','17:00:00'),(5,'17:00:00','19:00:00');
/*!40000 ALTER TABLE `timeslots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `email` varchar(45) NOT NULL,
  `name` varchar(45) NOT NULL,
  `password` varchar(45) NOT NULL,
  `role` varchar(45) NOT NULL,
  `created_at` datetime NOT NULL,
  `misuse_flag` int DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('25039467@myrp.edu.sg','Goh KY','15ef72a49f5d5d8d56fec4738191b01fc74c2f5e','employee','2026-07-23 22:26:58',30),('admin1@gmail.com','admin1','7c222fb2927d828af22f592134e8932480637c0d','admin','2026-07-22 22:16:54',0),('employee@test.com','Eugene Crab','7c222fb2927d828af22f592134e8932480637c0d','employee','2026-07-24 10:48:12',10),('employee1@gmail.com','employee1','7c222fb2927d828af22f592134e8932480637c0d','employee','2026-07-22 20:40:50',5),('kystarbuckdec@gmail.com','Goh Admin','15ef72a49f5d5d8d56fec4738191b01fc74c2f5e','staff','2026-07-23 22:34:31',0),('staff@test.com','Broccoli','7c222fb2927d828af22f592134e8932480637c0d','staff','2026-07-24 10:31:33',0),('staff1@gmail.com','staff1','9bc34549d565d9505b287de0cd20ac77be1d3f2c','admin','2026-07-22 20:16:54',0),('stafftest@gmail.com','staff','7c222fb2927d828af22f592134e8932480637c0d','staff','2026-07-24 13:33:30',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `waiting_list`
--

DROP TABLE IF EXISTS `waiting_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `waiting_list` (
  `waitlist_id` int NOT NULL AUTO_INCREMENT,
  `waitlist_booking_date` datetime NOT NULL,
  `time_slot_id` int NOT NULL,
  `room_id` varchar(67) NOT NULL,
  `email` varchar(45) NOT NULL,
  `is_waiting` varchar(45) DEFAULT NULL,
  `is_cancelled` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`waitlist_id`),
  KEY `fk_waiting_list_study_rooms1_idx` (`room_id`),
  KEY `fk_waiting_list_users1_idx` (`email`),
  CONSTRAINT `fk_waiting_list_study_rooms1` FOREIGN KEY (`room_id`) REFERENCES `study_rooms` (`room_id`),
  CONSTRAINT `fk_waiting_list_users1` FOREIGN KEY (`email`) REFERENCES `users` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `waiting_list`
--

LOCK TABLES `waiting_list` WRITE;
/*!40000 ALTER TABLE `waiting_list` DISABLE KEYS */;
INSERT INTO `waiting_list` VALUES (1,'2026-07-25 00:00:00',1,'R004','employee1@gmail.com','1','0');
/*!40000 ALTER TABLE `waiting_list` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-24 21:49:26
