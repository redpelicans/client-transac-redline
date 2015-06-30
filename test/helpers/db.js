import  _  from 'lodash';
import r from 'rethinkdb';
import async  from 'async';
import debug  from 'debug';

let logerror = debug('transac:error')
  , loginfo = debug('transac:info');

let CONN;

let tables = {
    transacs: 'id'
};

export function init(opt, cb){
  //let params = process.env['NODE_ENV'] === 'travis' ? {host: 'localhost', db: 'test'} : opt.rethinkdb;
  let params = opt.rethinkdb;

  function initConnection(cb){
    r.connect(params, (err, conn) => {
      if(err) return cb(err);
      loginfo(`RethinkDB connected to database '${params.db}'`);
      cb(null, conn);
    })
  }

  function dbDrop(conn, cb){
    r.dbList().run(conn, (err, result) => {
      if(err) return cb(err);
      if(!_.contains(result, params.db)) return setImmediate(cb, null, conn);
      r.dbDrop(params.db).run(conn, (err) =>{
        if(err) return cb(err);
        loginfo(`RethinkDB database ${params.db} dropped`);
        cb(null, conn);
      });
    });
  }


  function dbCreate(conn, cb){
    r.dbCreate(params.db).run(conn, (err, result) => {
      if(err) return cb(err);
      loginfo(`RethinkDB database ${params.db} created`);
      cb(null, conn);
    })
  }

  function tablesCreate(conn, cb){
    async.map(_.pairs(tables), tableCreate(conn), err => { cb(err, conn) });
  }

  function tableCreate(conn){
    return function(x, cb){
      let [table, index] = x;
      r.db(params.db).tableCreate(table, {primaryKey: index}).run(conn, err => {
        if(err) return cb(err);
        loginfo(`RethinkDB database '${params.db}' table '${table}' created`);
        cb();
      });
    }
  }

  async.waterfall([initConnection, dbDrop, dbCreate, tablesCreate], (err, conn) => {
    CONN = conn;
    cb(err, conn);
  });

}

export function close(cb){
  CONN.close(cb);
}
