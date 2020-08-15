require('dotenv').config();

const express = require('express');
const request = require('request');
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

const { connectDB } = require('./config/db');
const { sendMail } = require('./middlewares/nodeMailer');

async function intialiseDb() {
  await connectDB(process.env.DB_URL);
}

intialiseDb();

const TrafficSchema = new mongoose.Schema({
	detail: {
		type: Object,
	},
});

const Traffic = mongoose.model('traffic', TrafficSchema);

let accessToken = '';
let options = {
  'method': 'GET',
  'url': 'https://traffic.ls.hereapi.com/traffic/6.1/flow.json?bbox=30.7068%2C76.7854%3B30.7020%2C76.7932',
  'headers': {
    'Authorization': `Bearer ${accessToken}`,
  }
};

const oauth = OAuth({
  consumer: {
      key: process.env.OAuthKey, // Access Key
      secret: process.env.OAuthSecretKey //Secret key
  },
  signature_method: 'HMAC-SHA256',
  hash_function(base_string, key) {
      return crypto
          .createHmac('sha256', key)
          .update(base_string)
          .digest('base64')
  },
});

const requestData = {
  url: 'https://account.api.here.com/oauth2/token',
  method: 'POST',
  data: { grant_type: 'client_credentials' },
};

function getAccessToken() {
    request(
        {
            url: requestData.url,
            method: requestData.method,
            form: requestData.data,
            headers: oauth.toHeader(oauth.authorize(requestData)),
        },
        function (error, response, body) {
            if(error) {
              const mailOptions = {
                from: process.env.username,
                to: process.env.username,
                subject: 'Error during token generation',
                text: `Your api has just met with a error, while generating access token`,
              };
              sendMail(mailOptions);
            }
            else if(response.statusCode == 200) {
                const res = JSON.parse(response.body);
                accessToken = res.access_token;
                options.headers.Authorization = `Bearer ${accessToken}`
                const mailOptions = {
                  from: process.env.username,
                  to: process.env.username,
                  subject: 'New Access Token Generated',
                  text: `Your api was just granted a new Access Token`,
                };
                sendMail(mailOptions);
            }
            else {
              const mailOptions = {
                from: process.env.username,
                to: process.env.username,
                subject: 'Unusual Happened',
                text: `Something unsual happened with your api`,
              };
              sendMail(mailOptions);
            }
        }
    );
}

async function addData() {
  try {
    request(options,async function (error, response) {
      if (error) {
        console.log(error);
        const mailOptions = {
          from: process.env.username,
          to: process.env.username,
          subject: 'Error in request of addData Function',
          text: `${error}`,
        };
        sendMail(mailOptions);
      } 
      else {
        let res = JSON.parse(response.body);
        if(res.error && res.error === 'Unauthorized') {
          const mailOptions = {
            from: process.env.username,
            to: process.env.username,
            subject: 'Unauthorization Error in Here Api',
            text: `${res.error}`,
          };
          sendMail(mailOptions);
          getAccessToken();
        }
        else {
          res.CREATED_TIMESTAMP = new Date(res.CREATED_TIMESTAMP);
          for(let i=0; i<res.RWS[0].RW.length; i++) {
            res.RWS[0].RW[i].PBT = new Date(res.RWS[0].RW[i].PBT);
          }
          await Traffic.create({
            detail: res,
          });
          console.log(`Data Fetched at ${res.CREATED_TIMESTAMP}`);
        }
      }
    });
  } catch (error) {
    console.log(error);
    const mailOptions = {
      from: process.env.username,
      to: process.env.username,
      subject: 'Error in Catch block of addData Function',
      text: `${error}`,
    };
    sendMail(mailOptions);
  }
}

setInterval(addData, 3000);

app.listen(PORT, () => {
  console.log(`Server is up and listening on port no ${PORT}`);
})