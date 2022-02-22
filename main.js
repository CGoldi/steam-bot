/**
 * SteamUser example - onlineStatus SteamBot
 *
 * Log into steam and send a message whenever a friends status changes
 */

const axios = require('axios');
const SteamTotp = require('steam-totp');
const SteamUser = require('steam-user'); 

var client = new SteamUser();

const url = 'http://192.225.225.225:5888/message?token=<token>';
var friendList = [["<steam_ID>", "<name>", -1]];

var statusDict = {};

client.logOn({
	"accountName": "<username>",
	"password": "<password>"
        // "twoFactorCode": SteamTotp.generateAuthCode('')
});

client.on('loggedOn', function(details) {
	console.log("Logged into Steam as " + client.steamID.getSteam3RenderedID());
	client.setPersona(SteamUser.EPersonaState.Online);
	client.gamesPlayed(1172470);
});

client.on('error', function(e) {
	// Some error occurred during logon
	console.log(e);
});

client.on('user', async function(sid, user) {
	for (let friend in friendList) {
		if(sid == friendList[friend][0]) {
			if (statusDict.hasOwnProperty(sid) == false) {
                		statusDict[sid] = user;
			} else {
				old_user = statusDict[sid]

				let currentDate = new Date();
				let time = currentDate.getHours() + ":" + currentDate.getMinutes() + ":" + currentDate.getSeconds();

				if (old_user['persona_state'] != user['persona_state'] && old_user['persona_state'] != null) {
					if (user['persona_state'] == 1) {
						// Friend gets online/ status changes to online
						console.log("send message - user is online - " + time);
						send(friendList[friend][1] + " is online", user['player_name'] + " is online - " + time, 6, user['avatar_url_full'])
					}
				}

				if (old_user['game_played_app_id'] != user['game_played_app_id'] && old_user['game_played_app_id'] != null) {

					if (user['game_played_app_id'] == 0) {
						// Friend stops playing a game
                                                console.log("send message - user stopped playing game");
						var gameJson = await getGame(old_user['game_played_app_id']);
						console.log(gameJson);
						console.log(gameJson['name']);
                                                send(friendList[friend][1] + " stopped playing", user['player_name'] + " stopped playing " + gameJson['name'] + " - " + time, 3, gameJson['header_image']);

                                        } else {
						// Friend start playing a game
						console.log("send message - user is playing");
						var gameJson = await getGame(user['game_played_app_id']);
						console.log(gameJson);
                                                console.log(gameJson['name']);
						send(friendList[friend][1] + " is playing", user['player_name'] + " is playing " + gameJson['name'] + " - " + time, 5, gameJson['header_image']);
					}
                        	}

				statusDict[sid] = user;
			}
		}

		console.log(statusDict);
	}
});


// Send message to gotify server for push notification
function send(title_value, message_value, priority_value, image) {
	var bodyFormData = {"title": title_value,
			"message": message_value,
			"priority": priority_value,
                                "extras": {
                                        "client::notification": {
                                                "bigImageUrl": image
					}
                                }
			};

	axios({
  		method: "post",
  		headers: {
    			"Content-Type": "application/json",
  		},
  		url: url,
  		data: bodyFormData,
	})
  	.then((response) => console.log(response.data))
  	.catch((err) => console.log(err.response ? error.response.data : err));
}


// Retrieve game info
async function getGame(appid) {

        let requestData = await axios.get("https://store.steampowered.com/api/appdetails?appids=" + appid)
        .then((response) => {
                return response.data;
        })
        .catch(err=> {
                console.log(err);
        });

        dataJson = requestData[appid]['data'];

        return dataJson;
}
