/**
 * Created by macdja38 on 2016-06-13.
 */

var Utils = require('../lib/utils');
var utils = new Utils();

module.exports = class rank {
    constructor(cl, config, raven) {
        this.client = cl;
        this.config = config;
        this.raven = raven;

        this.onJoin = (server, user) => {
            var rank = config.get("roles", false, {server: server.id});
            if (rank && rank.joinrole) {
                rank = server.roles.get("id", rank.joinrole);
                if (rank) {
                    this.client.addMemberToRole(user, rank, (error)=> {
                        if (error) {
                            let logChannel = this.config.get("msgLog", false, {server: server.id});
                            if (logChannel) {
                                logChannel = server.channels.get("id", logChannel);
                                if (logChannel) {
                                    this.client.sendMessage(logChannel, `Error ${error} promoting ${user} please redefine your rank and make sure the bot has enough permissions.`)
                                }
                            }
                        } else {
                            let logChannel = this.config.get("msgLog", false, {server: server.id});
                            if (logChannel) {
                                logChannel = server.channels.get("id", logChannel);
                                if (logChannel) {
                                    this.client.sendMessage(logChannel, `${utils.clean(user.username)} was promoted to ${utils.clean(rank.name)}!`)
                                }
                            }
                        }
                    })
                }
            }
        };
    }

    onDisconnect() {
        this.client.removeListener("serverNewMember", this.onJoin);
    }

    onReady() {
        this.client.on("serverNewMember", this.onJoin);
    }

    getCommands() {
        return ["rank"];
    }

    onCommand(msg, command, perms) {
        console.log("autoRank");
        if (command.command === "rank") {
            if (command.arguments[0] === "add" && perms.check(msg, "admin.rank.add")) {
                let roleId;
                if (command.options.group && !command.options.role) {
                    command.options.role = command.options.group;
                }
                if (command.options.role) {
                    console.log(command.options.role);
                    if (/<@&\d+>/.test(command.options.role)) {
                        console.log("Found role mention");
                        roleId = msg.channel.server.roles.get("id", command.options.role.match(/<@&(\d+)>/)[1]);
                    }
                    else {
                        roleId = msg.channel.server.roles.get("name", command.options.role);
                    }
                    if (roleId) {
                        roleId = roleId.id
                    }
                    else {
                        msg.reply("Could not find role with that name, please try a mention or name, names are case sensitive");
                        return true;
                    }
                    let roleName = command.arguments[1].toLowerCase();
                    let oldRoles = this.config.get("roles", {}, {server: msg.server.id});
                    oldRoles[roleName] = roleId;
                    this.config.set("roles", oldRoles, {server: msg.server.id});
                    msg.reply(":thumbsup::skin-tone-2:");
                    return true;
                }
            }
            if (command.arguments[0] === "remove" && perms.check(msg, "admin.rank.remove")) {
                if (command.arguments[1]) {
                    msg.reply(`Please supply a rank to remove using \`${command.prefix}rank remove \<rank\>\`, for a list of ranks use \`${command.prefix}rank list\``);
                    return true;
                }
                let rankToJoin = command.arguments[1].toLowerCase();
                let oldRoles = this.config.get("roles", {}, {server: msg.server.id});
                if (oldRoles.hasOwnProperty(rankToJoin)) {
                    delete oldRoles[rankToJoin];
                    this.config.set("roles", oldRoles, {server: msg.server.id});
                } else {
                    msg.reply(`Role could not be found, use \`${command.prefix}rank list\` to see the current ranks.`);
                }
            }
            if (command.arguments[0] === "list" && perms.check(msg, "rank.list")) {
                var roles = this.config.get("roles", {}, {server: msg.server.id});
                let coloredRolesList = "";
                for (var role in roles) {
                    if (roles.hasOwnProperty(role) && role != "joinrole") {
                        if (perms.check(msg, `rank.join.${role}`)) {
                            coloredRolesList += `+${role}\n`;
                        } else {
                            coloredRolesList += `-${role}\n`;
                        }
                    }
                }
                if (coloredRolesList != "") {
                    msg.channel.sendMessage(`Roles you can join are highlighted in green\`\`\`diff\n${coloredRolesList}\`\`\``)
                } else {
                    msg.reply(`No ranks are setup to be join-able.`)
                }
            }
            if (command.arguments[0] === "join" && perms.check(msg, "rank.join.use")) {
                roles = this.config.get("roles", command.arguments[1], {server: msg.server.id});
                if (!command.arguments[1] && !roles[command.arguments[1]]) {
                    msg.reply(`Please supply a rank to join using \`${command.prefix}rank join \<rank\>\`, for a list of ranks use \`${command.prefix}rank list\``);
                    return true;
                }
                let rankToJoin = command.arguments[1].toLowerCase();
                if (!perms.check(msg, `rank.join.${rankToJoin}`)) {
                    msg.reply(`You do not have perms to join this rank for a list of ranks use \`${command.prefix}rank list\``);
                    return true;
                }
                role = msg.server.roles.get("id", roles[rankToJoin]);
                if (role) {
                    this.client.addMemberToRole(msg.author, role, (error)=> {
                        if (error) {
                            let logChannel = this.config.get("msgLog", false, {server: msg.server.id});
                            if (logChannel) {
                                logChannel = msg.server.channels.get("id", logChannel);
                                if (logChannel) {
                                    this.client.sendMessage(logChannel, `Error ${error} promoting ${utils.removeBlocks(msg.author.username)} try redefining your rank and making sure the bot has enough permissions.`).catch(console.error)
                                }
                            }
                        } else {
                            let logChannel = this.config.get("msgLog", false, {server: msg.server.id});
                            if (logChannel) {
                                logChannel = msg.server.channels.get("id", logChannel);
                                if (logChannel) {
                                    this.client.sendMessage(logChannel, `${utils.removeBlocks(msg.author.username)} added themselves to ${utils.removeBlocks(role.name)}!`)
                                }
                            }
                            msg.reply(":thumbsup::skin-tone-2:");
                        }
                    })
                } else {
                    msg.reply(`Role could not be found, have an administrator use \`${command.prefix}rank add\` to update it.`);
                    return true;
                }
            }
            if (command.arguments[0] === "leave" && perms.check(msg, "rank.leave.use")) {
                if (!command.arguments[1] && !roles[command.arguments[1]]) {
                    msg.reply(`Please supply a rank to leave using \`${command.prefix}rank leave \<rank\>\`, for a list of ranks use \`${command.prefix}rank list\``);
                    return true;
                }
                roles = this.config.get("roles", arguments[1].toLowerCase(), {server: msg.server.id});
                if (!perms.check(msg, `rank.leave.${command.arguments[1]}`)) {
                    msg.reply(`You do not have perms to join this rank for a list of ranks use \`${command.prefix}rank list\``);
                    return true;
                }
                role = msg.server.roles.get("id", roles[command.arguments[1]]);
                if (role) {
                    this.client.removeMemberFromRole(msg.author, role, (error)=> {
                        if (error) {
                            let logChannel = this.config.get("msgLog", false, {server: msg.server.id});
                            if (logChannel) {
                                logChannel = msg.server.channels.get("id", logChannel);
                                if (logChannel) {
                                    this.client.sendMessage(logChannel, `Error ${error} demoting ${utils.removeBlocks(msg.author.username)} try redefining your rank and making sure the bot has enough permissions.`).catch(console.error)
                                }
                            }
                        } else {
                            let logChannel = this.config.get("msgLog", false, {server: msg.server.id});
                            if (logChannel) {
                                logChannel = msg.server.channels.get("id", logChannel);
                                if (logChannel) {
                                    this.client.sendMessage(logChannel, `${utils.removeBlocks(msg.author.username)} removed themselves from ${utils.removeBlocks(role.name)}!`)
                                }
                            }
                            msg.reply(":thumbsup::skin-tone-2:");
                        }
                    })
                } else {
                    msg.reply(`Role could not be found, have an administrator use \`${command.prefix}rank add\` to update it.`);
                    return true;
                }
            }
        }
        return false;
    }
};
