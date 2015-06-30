import  should from "should";
import  async from "async";
import  _ from "lodash";
import * as DB from './helpers/db';
import params from "./params";
import * as transacd   from "transacd";
import transac  from "../src";

let server;

function run(transac, cb){
  transac.info('label', 'message ...');
  cb();
}

describe('Locked Transac', () => {

  before(cb => {
    DB.init(params, err => { 
      if(err)return cb(err);
      transacd.create(params, (err, srv) => {
         if(err) throw err;  
        server = srv;
        cb();
      });
    })
  });

  after(cb => {
    server.stop(err => cb());
  });




  it('create a locked one', (cb) => {
    transac(params.url)('T2', run, {locked: true}, (err, id) => {
      should(err).be.null;
      should(id).be.ok;
      cb();
    });
  });

  it('check it is locked', (cb) => {
    transac(params.url)('T2', run, err => {
      should(err.message).match(/locked/);
      cb();
    });
  });


});
