var Hangups      = require('hangupsjs'),
    slate        = require('slate-irc'),
    tls          = require('tls'),
    configLoader = require('eu-node-config'),
    config       = require('./config.json'),
    cache        = require('memory-cache'),
    Q            = require('q'),
    log          = require('winston');

let hangouts = new Hangups();
let irc;
// TODO, global variables :(((
//hangouts.loglevel('debug');

let ownId;


function parseSegments(segments) {
  let out = [];
  if(segments.segment) {
    segments.segment.forEach(function(segment) {
      if(segment.type == "TEXT" || segment.type == "LINK") {
        out.push(segment.text);
      }
    });
  }
  if(segments.attachment) {
    segments.attachment.forEach((attachment) => {
      try {
        if(attachment.embed_item.type_[0] == 249) {
          let embedObj = attachment.embed_item.data;
          let img = embedObj[Object.keys(embedObj)[0]][0][3]; // Don't ask
          if(img === null) {
            out.push("<img format stuff changed I think>");
          } else {
            out.push(img);
          }
        } else {
          out.push(`<attachment of type ${attachment}?>`);
        }
      } catch(ex) {
        console.log(JSON.stringify(attachment));
        out.push(`<unrecognized attachment ${attachment}>`);
      }
    });
  }
  return out.join(" - ");
}

function getName(id) {
  if(config.id_name_map[id]) {
    return Q(config.id_name_map[id]);
  }
  let cached = cache.get("uid." + id);
  if(cached) {
    return Q(cached);
  }
  return hangouts.getentitybyid([id]).then((entities) => {
    console.log(entities.entities[0]);
    let name = entities.entities[0].properties.display_name;
    cache.put("uid." + id, name, 3 * 60 * 1000);
    return Q(name);
  });
}

function getOwnId() {
  return hangouts.getselfinfo().then(function(info) {
    ownId = info.self_entity.id.gaia_id;
  });
}

function addHandlers() {
  irc.on('message', (msg) => {
    let txtBuilder = new Hangups.MessageBuilder();
    hangouts.sendchatmessage(config.hangout_id, txtBuilder.text("<"+msg.from+"> " + msg.message).toSegments()).fail((err) => {
      console.log("Err sending hangout message", err);
    });
  });
  hangouts.on('chat_message', (msg) => {
    if(msg.sender_id.gaia_id === ownId) {
      // ignore stuff I said
      return;
    }
    getName(msg.sender_id.gaia_id).then((name) => {
      irc.send(config.channel, name + ": " + parseSegments(msg.chat_message.message_content));
    }).fail((err) => {
      console.log("Error getting name to send irc message", err);
    });
  });
  hangouts.on('connect_failed', () => {
    winston.error("hangouts connection failed");
    process.exit(1);
  });
  return Q(true);
}

function s3Auth(config) {
  return Q.Promise((resolve, reject) => {
    reject("TODO");
  });
}

function ircAuth(config) {
  return Q.Promise((resolve, reject) => {
  });
}

function connectToHangouts(config) {
  return hangouts.connect(() => ({auth: Hangups.authStdin}));
}
function connectToIrc(config) {
  return Q.Promise(function(resolve, reject) {
    let stream = tls.connect({port: config.port, host: config.host, rejectUnauthorized: config.secureCert});
    irc = slate(stream);
    irc.user("kanbasnat", "kanbasnat");
    irc.nick(config.nick);
    irc.on('welcome', function(nick) {
      console.log("Connected to irc as " + nick);
      irc.join(config.channel);
      resolve(config);
    });
    irc.on('disconnect', () => {
      winston.error("IRC disconnect; exiting to restart");
      // TODO, handle better
      process.exit(1);
    });
  });
}

configLoader.loadConfig({
  secureCert: true,
  nick: 'kanbasnat',
  port: 6697,
  host: {required: true},
  hangoutChannels: {required: true},
  idNameMap: {default: {}},
  owner: {required: true},
  s3Bucket: {required: false},
})
.then(connectToIrc)
.then(connectToHangouts)
.then(getOwnId)
.then(addHandlers)
.fail((err) => {
  winston.error(err);
});
