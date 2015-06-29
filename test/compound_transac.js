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
const TRANSAC = {label: 'T2', valueDate: new Date(2015, 6, 22)};

function run(transac, cb){
  transac.info('message1');
  cb();
}

describe('Compound Transac', () => {

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


  it('Create one', cb => {
    transac(params.url)(TRANSAC.label, run, {compound: true}, (err, id) => {
      should(err).be.null;
      should(id).be.ok;
      transacId = id;
      cb();
    });
  });

  it('Re Create one', cb => {
    transac(params.url)(TRANSAC.label, run, {compound: true}, (err, id) => {
      should(err).be.null;
      should(id).be.ok;
      should(id).eql(transacId);
      cb();
    });
  });

  it('Load it', cb => {
    let url = params.url + `/transacs/${transacId}`;
    request({ url: url, timeout: 1000, method: 'GET' , json: true}, (err, response, body) => {
      should(err).be.null;
      should(body.id).eql(transacId);
      should(body.children.length).eql(2);
      //console.log(util.inspect(body, {depth: 5}))
      cb();
    })
  });
});
