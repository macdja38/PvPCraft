/**
 * Created by macdja38 on 2016-04-25.
 */
"use strict";

import utils from "../lib/utils.js";

import StandardDB from "../lib/StandardDB";

// let DB = require('../lib/database.js');
// let db = new DB();

class logging {
  /**
   * Instantiates the module
   * @constructor
   * @param {Object} e
   * @param {Eris} e.client Eris client
   * @param {Config} e.config File based config
   * @param {Raven?} e.raven Raven error logging system
   * @param {Config} e.auth File based config for keys and tokens and authorisation data
   * @param {ConfigDB} e.configDB database based config system, specifically for per guild settings
   * @param {R} e.r Rethinkdb r
   * @param {Permissions} e.perms Permissions Object
   * @param {Feeds} e.feeds Feeds Object
   * @param {MessageSender} e.messageSender Instantiated message sender
   * @param {SlowSender} e.slowSender Instantiated slow sender
   * @param {PvPClient} e.pvpClient PvPCraft client library instance
   */
  constructor(e) {
    this.client = e.client;
    this.r = e.r;
  }

  /**
   * Get's called every message.
   * @param {Message} msg
   * @param {Permissions} perms
   */
  onMessage(msg, perms) {
    if (!msg.author || msg.author.bot) return;
    this.r
      .table("messages")
      .insert(
        {id: msg.id, channel_id: msg.channel.id, author_id: msg.author.id, content: msg.content},
        {durability: "soft", returnChanges: false}
      )
      .run();
  }
}

module.exports = logging;
