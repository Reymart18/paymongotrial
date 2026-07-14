CREATE USER 'hoa_user'@'localhost'
IDENTIFIED BY 'pvhaiprotect18';

GRANT ALL PRIVILEGES ON hoa_portal.* 
TO 'hoa_user'@'localhost';

FLUSH PRIVILEGES;

-------------
ALTER USER 'hoa_user'@'localhost'
IDENTIFIED BY 'pvhaiprotect18';

GRANT ALL PRIVILEGES ON hoa_dev.*
TO 'hoa_user'@'localhost';

FLUSH PRIVILEGES;