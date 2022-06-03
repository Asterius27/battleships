# Battleships
TAW project

## Installation

Install node 16.14.2, npm 8.5.0 and MongoDB and then run:
```
npm install -g typescript
```
and
```
npm install -g @angular/cli
```
To install typescript and angular, and then run:
```
npm install
```
Inside the backend folder and inside the battleships_frontend folder to install all of the dependencies

Rename .env.sample file inside the backend directory to .env and fill out its fields:<br/>
JWT_SECRET is the secret key used to sign the json web token<br/>
DATABASE_URL is the url of the mongodb database<br/>
FRONTEND_URL is the url of the angular frontend<br/>
PORT is the port where you want to run the backend

Inside battleships_frontend/src/environments put your backend url in both files:
```
export const environment = {
  ...
  backend_url: 'your backend url'
  ...
};
```

Finally run the application by running:
```
npm start
```
Inside the backend folder and:
```
ng serve --open
```
Inside the battleships_frontend folder.

To run the mobile application you need to have cordova, gradle, the android sdk, the android emulator and the jdk installed.

Then change put the backend url in the environment.ts and environment.prod.ts files located at \battleships_mobile_frontend\src\environments (don't use localhost, use the ip adress)

Then run the following commands inside the battleships_mobile folder:
```
cordova platform add android
```
```
cordova plugin add cordova-plugin-device
```
Then modify the AndroidManifest.xml file inside \battleships_mobile\platforms\android\app\src\main to add the following attribute in the application tag:
```
android:networkSecurityConfig="@xml/network_security_config"
```
Then create a network_security_config.xml file inside \battleships_mobile\platforms\android\app\src\main\res\xml as follows:
```
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">your-backend-url</domain>
    </domain-config>
</network-security-config>
```
Then run the following command inside the battleships_mobile_frontend folder:
```
npm install
```
```
ng build
```
Then run the following command inside the battleships_mobile folder:
```
cordova build
```
Then to install the mobile app in the android emulator run:
```
adb install <build.apk>
```
And the app should appear in your emulator ready to be used.
