Instructions

Install node 16.14.2, npm 8.5.0 and MongoDB and then run

npm install -g typescript

and

npm install -g @angular/cli

To install typescript and angular (if you don't have them already installed), and then run:

npm install

Inside the backend folder and inside the battleships_frontend folder to install all of the dependencies.

Rename .env.sample file inside the backend directory to .env and fill out its fields:

JWT_SECRET is the secret key used to sign the json web token
DATABASE_URL is the url of the mongodb database
FRONTEND_URL is the url of the angular frontend
PORT is the port where you want to run the backend

Inside battleships_frontend/src/environments put your backend url in both files (environment.prod.ts and environment.ts):

export const environment = {
  ...
  backend_url: 'your backend url'
  ...
};


Finally run the application by running:

npm start

Inside the backend folder and:

ng serve --open

Inside the battleships_frontend folder.

To run the mobile application you need to have cordova, gradle, the android sdk, the android emulator and the jdk installed.

Then change put the backend url in the environment.ts and environment.prod.ts files located at \battleships_mobile_frontend\src\environments (don't use localhost, use the ip adress)

Then put your backend url in the network_security_config.xml file located at \battleships_mobile\platforms\android\app\src\main\res\xml

Then run the following commands inside the battleships_mobile_frontend folder:

npm install

ng build

Then run the following command inside the battleships_mobile folder:

cordova build

Then to install the mobile app in the android emulator run:

adb install <build.apk>

And the app should appear in your emulator ready to be used.
