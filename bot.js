const Discord = require("discord.js");
const administrators = ["244905301059436545", "239900855875141632"];
require('colors');
const client = new Discord.Client();
const fs = require("fs");
const config = JSON.parse(fs.readFileSync('config.json'));
const mysql = require('sync-mysql');
const cm = new mysql({
	host: process.env.host,
	user: process.env.user,
	password: process.env.pass,
	database: process.env.db
});

let balance = {};

// Bot Functions Below

client.on('ready', () => {
	console.log((`[Discord] ==> Logged in as ${client.user.tag}!`).green);
});

client.on('message', msg => {
	if(msg.author.bot){return;}
	if(msg.content.startsWith(config.prefix+'balance')){
		msg.channel.send({
			"embed": {
				"title": "Toshi-Bot Currency",
				"color": 3447003,
				"fields": [{
					"name": msg.author.username+"'s Wallet",
					"value": "$"+balance.get(msg.author).toFixed(2)
				}],
				"timestamp": new Date(),
				"footer": {
					"icon_url": client.user.avatarURL,
					"text": "© Toshi-Bot"
				}
			}
		});
	} else if (msg.content.startsWith(config.prefix+'transfer ')) {
		// ["<@!123456789>", "25.74"]
		let message = msg.content.substring(10).split(' ');

		if(message.length != 2) {
			// 🅱roke
			return;
		}

		let targetid = message[0].replace(/<@!?([0-9]+)>/,'$1');
		targetid = msg.guild.members.get(targetid).user;
		let money = parseFloat(message[1]);
		if (isNaN(money)) {return;}

		console.log(money);
		console.log(targetid.username);
		console.log(message);

		if(money && targetid) {
			balance.transfer(msg.author,targetid,money,msg);
		}
	} else if (msg.content.startsWith(config.prefixadmin+'setbalance ')&&administrators.includes(msg.author.id)) {
		let message = msg.content.substring(11).split(' ');
		if(message.length != 2) {
			return;
		}
		let targetid = message[0].replace(/<@!?([0-9]+)>/,'$1');
		targetid = msg.guild.members.get(targetid).user;
		let money = parseFloat(message[1]);
		if (isNaN(money)) {return;}
		if (money && targetid) {
			balance.set(targetid, money);
		}
	} else if (msg.content === config.prefix+'help') {
		msg.channel.send({"embed": {"color": 3447003, "fields": [{"name": "Commands", "value": ",balance <mention{unimplemented}> - Show your balance (soon show others balances)\n,transfer <mention> <amount> - Transfer money to a user.\n,top - Show top 10 users."}]}});
	} else if (msg.content === config.prefixadmin+'help'&&administrators.includes(msg.author.id)) {
		msg.channel.send({"embed": {"color": 3447003, "fields": [{"name": "Admin Commands", "value": ",,setbalance <mention> <money> - Set someone's balance\n,,payday {UNIMPLEMENTED} - Pay all users in discord."}]}});
	} else if (msg.content === config.prefix+'top') {
		var gettop = cm.query('SELECT * FROM `toshibot` ORDER BY CAST (`balance` AS DECIMAL) DESC LIMIT 0,9');
		let output = "";
		if (gettop > 0) {
			for (i in gettop) {
				output += "Adding Usernames Soon...: - $"+(parseInt(gettop[i].bal).toFixed(2)).toString()+"\n";
			}
		} else {
			output = "No recored user data.";
		}
		msg.channel.send({"embed": {"color": 3447003, "fields": [{"name": "Top 10 Users", "value": output}]}});
	} else if (msg.content === config.prefixadmin+'purge'&&administrators.includes(msg.author.id)) {
		for (var i = 0; i < 10; i++) {
			msg.channel.bulkDelete(100);
		}
	}/* else if (msg.content == config.prefixadmin+'payday') {
		var getusers =
		for (i in msg.guild.members) {
			balance.set(msg.guild.members[i].user.id, msg.guild.members[i].bal + 1);
		}
	}*/
});

// All Functions Below

/*balance.exists = (user) => {
	//
	cm.query('SELECT * FROM `debug` WHERE `usr` = '+user);
	if () {
		//
	} else {
		//
	}
}*/

balance.transfer = (user1, user2, amount, message) => {
	console.log("a:"+amount);
	// transfer user1 > user2
	let u1money = balance.get(user1);
	if (u1money < amount || amount < 0) return;
	let u2money = balance.get(user2);

	console.log('u1money: '+ typeof u1money);
	console.log('u2money: '+ typeof u2money);

	balance.set(user1, u1money - amount);
	balance.set(user2, u2money + amount);
	message.channel.send({
		"embed": {
			"title": "Toshi-Bot Currency",
			"color": 3447003,
			"fields": [{
				"name": user1.username+" ==> "+user2.username,
				"value": "$"+amount.toFixed(2)+" was transferred."
			}],
			"timestamp": new Date(),
			"footer": {
				"icon_url": client.user.avatarURL,
				"text": "© Toshi-Bot"
			}
		}
	});
};

balance.make = (user) => {
	try {
		cm.query('INSERT INTO `toshibot`(`userid`) VALUES (\''+user.id+'\')');
	} catch (err) {
		console.log('[VAULT] MySQL Error: ' + err);
	}
	console.log('[VAULT] Created account for ' + user.username + '.');
}

balance.get = (user) => {
	var gotdata = cm.query('SELECT * FROM `toshibot` WHERE `userid` = ' + user.id); // this is fine daveeeeeeee!!! no edit required...
	if (gotdata.length > 0) {
		return parseFloat(gotdata[0].bal.toFixed(2));
	} else {
		balance.make(user);
		return 0;
	}
}

balance.set = (user, amount) => {

	console.log("b:"+amount);

	var setdata = cm.query('SELECT * FROM `toshibot` WHERE `userid` = ' + user.id);
	if (setdata.length > 0) {
		cm.query('UPDATE `toshibot` SET `balance`='+amount+' WHERE `userid` = ' + user.id);
		console.log('[VAULT] Updated ' + user.username + '\'s balance!');
		return true;
	} else {
		balance.make(user);
		cm.query('UPDATE `toshibot` SET `balance`='+amount+' WHERE `userid` = ' + user.id);
		console.log('[VAULT] Updated ' + user.username + '\'s balance!');
		return true;
	}
}

// EVERYTHING might need to be above the client login. PLEASE OH GOD DO IT.

client.login(process.env.token);
