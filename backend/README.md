npm install -g @nestjs/cli
nest new backend

npm install mysql2 @nestjs/typeorm typeorm @nestjs/jwt passport-jwt passport bcrypt multer csv-parser dotenv
npm install --save-dev @types/passport-jwt @types/bcrypt

npm install react-router-dom
npm install @nestjs/passport
npm install xlsx
npm install --save-dev @types/multer

to access xampp db
CREATE USER IF NOT EXISTS 'hoa_user'@'localhost' IDENTIFIED BY 'strongpassword';
GRANT ALL PRIVILEGES ON hoa_portal.* TO 'hoa_user'@'localhost';
FLUSH PRIVILEGES;

npm install --legacy-peer-deps