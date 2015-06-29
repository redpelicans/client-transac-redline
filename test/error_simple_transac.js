import should from "should";
import async from "async";
import _ from "lodash";
import util from "util";
import os from 'os';
import request from "request";
import * as DB from './helpers/db';
import params from "./params";
import * as transacd   from "../../transacd2";
import transac  from "../src";

let server, transacId;
const TRANSAC = {label: 'T2', valueDate: new Date(2015, 6, 22), locked: false};

function run(transac, cb){
  transac.info('message1');
  transac.info(['message2', 'message3']);
  transac.error('event1', 'message4' );
  transac.info('event2', ['message5', 'message6'] );
  cb();
}

describe('Plain Error Transac', () => {

  before(cb => {
    DB.init(params, err => { 
      if(err)return cb(err);
      transacd.create(params, (err, srv) => {
        server = srv;
        cb();
      });
    })
  });

  after(cb => {
    server.stop(err => cb());
  });


  it('create one', cb => {
    transac(params.url)(TRANSAC.label, run, {valueDate: TRANSAC.valueDate, locked: TRANSAC.locked}, (err, id) => {
      should(err).be.null;
      should(id).be.ok;
      transacId = id;
      cb();
    });
  });


  it('get it', cb => {
    let url = params.url + `/transacs/${transacId}`;
    request({ url: url, timeout: 1000, method: 'GET' , json: true}, (err, response, body) => {
      should(err).be.null;
      //console.log(util.inspect(body, {depth: 5}))
      should(body.status).eql('error');
      cb();
    })
  });
});
