const
redis = require('ioredis'),
config  = require('./config');

var sub,pub;
var broadcast = require('./index');
//const message = require('./model/message');




redis.initCache = async function (config) {
    console.log("inside sub")
     //pub = await redis.connectRedis();
   
   
        client = redis.createClient(config.cache.host[0], config.cache.port);
  
   client.defineCommand('decrement', {
       numberOfKeys: 1,
       lua: 'if (redis.call("exists", KEYS[1]) > 0) then return redis.call("decr", KEYS[1]) end'
   });
   sub = new redis({
       port: config.cache.port,          // Redis port
       host: config.cache.host[0],   // Redis host
       family: 4,           // 4 (IPv4) or 6 (IPv6)
       password: config.cache.password ? config.cache.password : null,
       db: config.cache.db ? config.cache.db : null 
   });

   sub.on("error", function (err) {
       console.log("Error in sub redis client." + err);
     });
 
   sub.on('reconnecting', (stats) => {
       console.log('Reconnecting to Redis sub');
   });

    
   sub.on("message", function (channel, message) {
       console.log("redis",message);
       //pub.publish("ChatR",message);
      // broadcast.broadcast(JSON.parse(message));
   });

   sub.on("close", function () {
       console.log("Sub connection ended..");
   });

   sub.on("end", function () {
       console.log("Sub connection ended..");
   });

   sub.subscribe('chatR',async function (err, count) {
       console.log("Subscribed to channel chatRooms");
       console.log("count",count);
     
      
      
   });
};

redis.getDbConnection = function () {
   return client;
}

redis.connectRedis = function() {
   console.log("Connecting to redis");  
   console.log("host",config.cache.host[0]);

  return new Promise(function(resolve, reject){
     globalPub = new redis({
      port: config.cache.port,          // Redis port
      host: config.cache.host[0],   // Redis host
      family: 4,           // 4 (IPv4) or 6 (IPv6)
      password: config.cache.password,
      db: config.cache.db
    });
    globalPub.on("ready", function () {
      console.log("Pub ready.");
      resolve(globalPub);
    });
  })
}


module.exports = redis;