const mongoose = require("mongoose");

class MongoHandler {
    constructor(config, Logger) {
        this.mongo = mongoose;
        this.config = config;
        this.Logger = Logger;
        this.guild = require("../schemas/guild.js");
        this.channel = require("../schemas/channel.js");
        this.user = require("../schemas/user.js");
    };

    async connect() {
        await this.mongo.connect(this.config.uri);
    };

    // users
    getUserSettings(userId) {
        return this.user.findOne({ id: userId }).then(data => { return data });
    };

    createUserSettings(userId, lang, registered) {
        return this.user.create({
            id: userId,
            language: lang,
            registered: registered
        }).then(data => { return data });
    };

    deleteUserSettings(userId) {
        return this.user.deleteMany({ id: userId }).then(data => { return data; });
    };

    // guilds
    getGuildSettings(guildId) {
        return this.guild.findOne({ id: guildId }).then(data => { return data; });
    };

    createGuildSettings(guildId, registered, prefix, premium, adminroles = [], modroles = []) {
        return this.guild.create({
            id: guildId,
            registered: registered,
            prefix: prefix,
            premium: premium,
            adminroles: adminroles,
            modroles: modroles
        }).then(data => { return data; });
    };

    deleteGuildSettings(guildId) {
        return this.guild.deleteMany({ id: guildId }).then(data => { return data; });
    };

    // channels
    getChannelSettings(channelId) {
        return this.channel.findOne({ id: channelId }).then(data => { return data; });
    };

    createChannelSettings(channelId, guild, registered, limit, mode, ignore, filters, regex, filterUsage) {
        return this.channel.create({
            id: channelId,
            guild: guild,
            registered: registered,
            limit: limit,
            mode: mode,
            ignore: ignore,
            filters: filters,
            regex: regex,
            filterUsage: filterUsage
        });
    };

    deleteChannelSettings(channelId) {
        return this.channel.deleteMany({ id: channelId }).then(data => { return data; });
    };
};

module.exports = MongoHandler;