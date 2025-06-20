CREATE DATABASE DemoDB;
GO
USE DemoDB;
GO
CREATE TABLE static_table (
  id INT PRIMARY KEY,
  title NVARCHAR(100)
);
INSERT INTO static_table VALUES (1,'Hello'),(2,'World');
GO