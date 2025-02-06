const sqlite3 =require('sqlite3');

const db = new sqlite3.Database('./db.sqlite');

const {Low,JSONFile}=require('lowdb');

const adapter = new JSONFile('db.json');
const db2 = new Low(adapter);