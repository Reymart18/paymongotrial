CREATE USER 'hoa_user'@'localhost'
IDENTIFIED BY 'strongpassword';

GRANT ALL PRIVILEGES ON hoa_portal.* 
TO 'hoa_user'@'localhost';

FLUSH PRIVILEGES;