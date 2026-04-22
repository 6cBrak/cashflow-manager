-- Script de création de la base de données CashFlow Manager
-- Exécutez ce fichier avec : mysql -u root -p < create_db.sql

CREATE DATABASE IF NOT EXISTS cashflow_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'cashflow_user'@'localhost' IDENTIFIED BY 'cashflow_pass';
GRANT ALL PRIVILEGES ON cashflow_db.* TO 'cashflow_user'@'localhost';
FLUSH PRIVILEGES;

SELECT 'Base de données cashflow_db créée avec succès.' AS message;
