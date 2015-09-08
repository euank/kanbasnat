var Hangups = require('hangupsjs'),
    slate   = require('slate-irc'),
    tls     = require('tls'),
    config  = require('./config.json'),
    cache   = require('memory-cache'),
    Q       = require('q');

var hangouts = new Hangups();
var irc;
//hangouts.loglevel('debug');

var ownId;

function parseSegments(segments) {
	var out = [];
	if(segments.segment) {
		segments.segment.forEach(function(segment) {
			if(segment.type == "TEXT" || segment.type == "LINK") {
				out.push(segment.text);
			}
		});
	}
	if(segments.attachment) {
		segments.attachment.forEach(function(attachment) {
			try {
				if(attachment.embed_item.type_[0] == 249) {
					var embedObj = attachment.embed_item.data
					var img = embedObj[Object.keys(embedObj)[0]][0][3]; // Don't ask
					if(img == null) {
						console.log(JSON.stringify(attachment))
						out.push("<img format stuff changed I think>");
					} else {
						out.push(img);
					}
				}
			} catch(ex) {
				console.log(JSON.stringify(attachment))
				out.push("<unrecognized attachment>");
			}
		} );
	}
	return out.join(" - ");
}

function getName(id) {
	if(config.id_name_map[id]) {
		return Q(config.id_name_map[id]);
	}
	var cached = cache.get("uid." + id);
	if(cached) {
		return Q(cached);
	}
	return hangouts.getentitybyid([id]).then(function(entities) {
		console.log(entities.entities[0]);
		var name = entities.entities[0].properties.display_name;
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
	irc.on('message', function(msg) {
		var txtBuilder = new Hangups.MessageBuilder()
		hangouts.sendchatmessage(config.hangout_id, txtBuilder.text("<"+msg.from+"> " + msg.message).toSegments()).fail(function(err) {
			console.log("Err sending hangout message", err);
		})
	});
	hangouts.on('chat_message', function(msg) {
		if(msg.sender_id.gaia_id === ownId) {
			// ignore stuff I said
			return;
		}
		getName(msg.sender_id.gaia_id).then(function(name) {
			irc.send(config.channel, name + ": " + parseSegments(msg.chat_message.message_content));
		}).fail(function(err) {
			console.log("Error getting name to send irc message", err);
		});
	});
	return Q(true);
}

function connectToHangouts() {
	return hangouts.connect(function(){return {auth: Hangups.authStdin}});
}
function connectToIrc() {
	return Q.Promise(function(resolve, reject) {
		var stream = tls.connect({port: config.port, host: config.host, rejectUnauthorized: config.secureCert});
		irc = slate(stream);
		irc.user("kanbasnat", "kanbasnat");
		irc.nick(config.nick);
		irc.on('welcome', function(nick) {
			console.log("Connected to irc as " + nick);
			irc.join(config.channel);
			resolve();
		});
    irc.on('disconnect', function() {
      console.log("Got disconnected from IRC; balls");
      // TODO, handle better
      process.exit(1);
    });
	});
}

Q.all([connectToIrc(), connectToHangouts()]).then(getOwnId()).then(addHandlers).fail(function(err) {
	console.log(err.stack);
});
