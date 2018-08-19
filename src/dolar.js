#!/usr/local/bin/node
/* jshint esversion: 6 */

/*
# <bitbar.title>Dolar</bitbar.title>
# <bitbar.version>v1.0.0</bitbar.version>
# <bitbar.author>ygunayer</bitbar.author>
# <bitbar.author.github>ygunayer</bitbar.author.github>
# <bitbar.desc>Dolar ne kadar oldu</bitbar.desc>
# <bitbar.image>https://emojipedia-us.s3.amazonaws.com/thumbs/120/apple/129/fire_1f525.png</bitbar.image>
# <bitbar.dependencies>node,fs,path,request,child_process</bitbar.dependencies>
# <bitbar.abouturl>https:/github.com/ygunayer</bitbar.abouturl>
*/

const fs = require('fs');
const path = require('path');
const request = require('request');
const child_process = require('child_process');

// Detects user's menu bar style (assumes dark menu bar)
let boldColor = 'white';
try {
  child_process.execSync('defaults read -g AppleInterfaceStyle', { stdio: 'ignore' });
} catch (err) {
  // AppleInterfaceStyle not set, which means user has light menu bar style
  boldColor = 'black';
}

// Font, Color, and Emoji Settings
const colors = {
  red: 'red',
  green: 'green',
  default: boldColor
};

const upArrow = '↑';
const downArrow = `↓`;
const fireSymbol = '🔥';
const snowflakeSymbol = '❄️';

class DB {
  constructor(filename = path.join(__dirname, '../data/dolar.json')) {
    this.filename = filename;
  }

  load() {
    return new Promise((resolve, reject) => {
      fs.readFile(this.filename, 'utf8', (err, content) => {
        if (err) {
          if (err.code == 'ENOENT') {
            return resolve(null);
          }

          return reject(err);
        }

        try {
          resolve(JSON.parse(content))
        } catch (e) {
          resolve(null); // eat up error
        }
      });
    });
  }

  save(data) {
    return new Promise((resolve, reject) => {
      fs.writeFile(this.filename, JSON.stringify(data, null, 4), 'utf8', (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(true);
      });
    });
  }
}

const doGetData = function() {
  return new Promise((resolve, reject) => {
    request({
      url: `https://www.doviz.com/api/v1/currencies/USD/latest`,
      json: true
    }, (err, response, body) => {
      if (err) {
        return reject(err);
      }
      resolve(body);
    })
  });
};

const update = (data = {}, current) => {
  data = Object.assign({
    last: current,
    max: current,
    min: current
  }, data);

  const direction = 0;
  let symbol = '↔';
  let color = 'default';

  if (data.last < current) {
    symbol = `${upArrow}`;
    color = 'green';
  } else if (data.last > current) {
    symbol = `${downArrow}`;
    color = 'red';
  }

  if (data.min > current) {
    symbol = `${snowflakeSymbol}`;
    data.min = current;
  }

  if (data.max < current) {
    symbol = `${fireSymbol}`;
    data.max = current;
  }

  console.log(`${symbol} ${current} ₺/$ | color=${colors[color]}`);

  console.log('---');
  console.log(`Previous: ${data.last}, Change: ${(current - data.last).toFixed(4)}`);
  console.log(`${snowflakeSymbol} Min: ${data.min}, ${fireSymbol} Max: ${data.max}`);

  data.last = data.current = current;

  return data;
}

const db = new DB();

Promise.all([ db.load(), doGetData() ])
  .then(([ previous, data ]) => {
    const current = data.selling;
    return update(previous, current);
  })
  .then(db.save.bind(db))
  .catch(err => {
    console.error(err);
  });
