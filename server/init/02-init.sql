USE DemoDB;
GO
CREATE TABLE users (
  id INT PRIMARY KEY,
  username NVARCHAR(50),
  password NVARCHAR(50)
);
INSERT INTO users VALUES (1,'alice','alicepass'),(2,'bob','bobpass');
GO