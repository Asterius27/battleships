# battleships
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

Rename .env.sample file inside the backend directory to .env and fill out its fields:
JWT_SECRET is the secret key used to sign the json web token
DATABASE_URL is the url of the mongodb database
FRONTEND_URL is the url of the angular frontend
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
