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
import * as child_process from "child_process";
import stream from 'stream';

let server;

class LineReader extends stream.Transform{
  constructor(options){
    super(options);
    this.last = '';
  }

  _transform(chunck, encoding, cb){
    let lines = chunck.toString("utf8").split("\n");
    this.push(this.last + lines.shift());
    this.last = lines.pop();
    for(let l of lines) this.push(l);
    cb();
  }

  _flush(cb){
    this.push(this.last)
    cb();
  }
}

function run(transac, cb){
  let ls = child_process.spawn('ls', ['-al', '.'])
    , lineReader = new LineReader();

  ls.stdout.pipe(lineReader).pipe(transac);
  transac.on('finish', () => cb());
}

describe('Streamed Transac', () => {

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
    transac(params.url)('Stream1', run, (err, id) => {
      should(err).be.null;
      should(id).be.ok;
      cb();
    });
  });

});
