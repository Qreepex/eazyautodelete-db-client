const { Collection } = require("@discordjs/collection");
const RedisHandler = require("./RedisHandler.js");
const MongooseHandler = require("./MongoHandler.js");

class DatabaseHandler {
    constructor(config, Logger) {
        this._guildCache = new Collection();
        this._channelCache = new Collection();
        this._userCache = new Collection();
        this.connected = false;
        this.Logger = Logger;
        this.mongo = new MongooseHandler(config.mongo, this.Logger);
        this.redis = new RedisHandler(config.redis, this.Logger);
        this.config = config;
    };
    
    async connect() {
        await this.mongo.connect();
        await this.redis.connect();

        this.connected = true;

        this.Logger.info("🧰 Databases connected", "DATA");
    };

    // user
    async getUserSettings(userId) {
        let redisData = await this.redis.getHashfields(`user_${userId}`);
        if(redisData?.id) {
            return {
                id: redisData.id,
                registered: parseInt(redisData.registered),
                language: redisData.language
            };
        };
        let data = await this.mongo.getUserSettings(userId);
        if(!data) {
            data = await this.mongo.createUserSettings(userId);
        };

        let formattedData = {
            id: data.id,
            registered: data.registered,
            language: data.language
        };

        await this.redis.setHash(`user_${userId}`, formattedData);
        return formattedData;
    };

    async createUserSettings(userId, lang, registered) {
       await this.deleteUserSettings(userId);

       let data = await this.mongo.createUserSettings(userId, lang, registered);

        let formattedData = {
            id: data.id,
            registered: data.registered,
            language: data.language
        };

        await this.redis.setHash(`user_${userId}`, formattedData);
        return formattedData;
    };

    async deleteUserSettings(userId) {
        await this.redis.deleteKey(`user_${userId}`);
        await this.mongo.deleteUserSettings(userId);
    };

    async updateUserSettings(userId, lang, registered) {
        let data = await this.mongo.getUserSettings(userId);
        let formattedData = {
            id: data.id,
            registered: data.registered,
            language: data.language
        };
        if(formattedData.language === lang && formattedData.registered === registered) return formattedData;

        await this.deleteUserSettings(userId);
        return await this.createUserSettings(userId, lang, registered);
    };

    async deleteUserCache(userId) {
        await this.redis.deleteKey(`user_${userId}`);
    };

    async updateUserCache(userId) {
        let data = await this.mongo.getUserSettings(userId);
        if(!data) {
            data = await this.mongo.createUserSettings(userId, lang, registered);
        };

        let formattedData = {
            id: data.id,
            registered: data.registered,
            language: data.language
        };

        await this.redis.setHash(`user_${userId}`, formattedData);
    };
    
    // guilds
    async getGuildSettings(guildId) {
        let redisData = await this.redis.getHashfields(`guild_${guildId}`);
        console.log(redisData)

        if(redisData?.id) {
            return {
                id: redisData.id,
                registered: parseInt(redisData.registered),
                prefix: redisData.prefix,
                premium: redisData.premium,
                adminroles: redisData.adminroles === "null" ? [] : redisData.adminroles.split("_"),
                modroles: redisData.modroles === "null" ? [] : redisData.modroles.split("_")
            };
        };

        let data = await this.mongo.getGuildSettings(guildId);
        if(!data) {
            data = await this.mongo.createGuildSettings(guildId);
        };

        let formattedData = {
            id: data.id,
            registered: parseInt(data.registered),
            prefix: data.prefix,
            premium: data.premium,
            adminroles: data.adminroles,
            modroles: data.modroles
        };

        await this.redis.setHash(`guild_${guildId}`, {
            id: formattedData.id,
            registered: parseInt(formattedData.registered),
            prefix: formattedData.prefix,
            premium: formattedData.premium,
            adminroles: `${formattedData.adminroles?.length >= 1 ? formattedData.adminroles.join("_") : null}`,
            modroles: `${formattedData.modroles?.length >= 1 ? formattedData.modroles.join("_") : null}`
        });
        return formattedData;
    }

    async createGuildSettings(guildId, registered, prefix, premium, adminroles = [], modroles = []) {
       await this.deleteGuildSettings(guildId);

       let data = await this.mongo.createGuildSettings(guildId, registered, prefix, premium, adminroles, modroles);

        let formattedData = {
            id: data.id,
            registered: parseInt(data.registered),
            prefix: data.prefix,
            premium: data.premium,
            adminroles: data.adminroles,
            modroles: data.modroles
        };

        await this.redis.setHash(`guild_${guildId}`, {
            id: formattedData.id,
            registered: parseInt(formattedData.registered),
            prefix: formattedData.prefix,
            premium: formattedData.premium,
            adminroles: `${formattedData.adminroles?.length >= 1 ? formattedData.adminroles.join("_") : null}`,
            modroles: `${formattedData.modroles?.length >= 1 ? formattedData.modroles.join("_") : null}`
        });
        return formattedData;
    };

    async deleteGuildSettings(guildId) {
        await this.redis.deleteKey(`guild_${guildId}`);
        await this.mongo.deleteGuildSettings(guildId);
    };

    async updateGuildSettings(guildId, registered, prefix, premium, adminroles = [], modroles = []) {
        let data = await this.mongo.getGuildSettings(guildId);
        let formattedData = {
            id: data.id,
            registered: parseInt(data.registered),
            prefix: data.prefix,
            premium: data.premium,
            adminroles: data.adminroles,
            modroles: data.modroles
        };

        await this.deleteGuildSettings(guildId);
        return await this.createGuildSettings(guildId, registered || formattedData.registered, prefix, premium, adminroles, modroles);
    };

    async deleteGuildCache(guildId) {
        await this.redis.deleteKey(`guild_${guildId}`);
    };

    async updateGuildCache(guildId) {
        let data = await this.mongo.getGuildSettings(guildId);
        if(!data) {
            data = await this.mongo.createGuildSettings(guildId);
        };

        let formattedData = {
            id: data.id,
            registered: parseInt(data.registered),
            prefix: data.prefix,
            premium: data.premium,
            adminroles: data.adminroles,
            modroles: data.modroles
        };

        await this.redis.setHash(`guild_${guildId}`, {
            id: formattedData.id,
            registered: parseInt(formattedData.registered),
            prefix: formattedData.prefix,
            premium: formattedData.premium,
            adminroles: `${formattedData.adminroles?.length >= 1 ? formattedData.adminroles.join("_") : null}`,
            modroles: `${formattedData.modroles?.length >= 1 ? formattedData.modroles.join("_") : null}`
        });
    };

    // channels
    async getChannelSettings(channelId, guild) {
        let redisData = await this.redis.getHashfields(`channel_${channelId}`);
        
        if(redisData?.id) {
            return {
                id: redisData.id,
                guild: redisData.guild,
                registered: parseInt(redisData.registered),
                limit: isNaN(parseInt(redisData.limit)) ? null : parseInt(redisData.limit), // Zeit in ms oder Nachrichten Anzahl
                mode: parseInt(redisData.mode),
                ignore: redisData.ignore === "null" ? [] : redisData.ignore.split("_"),
                filters: redisData.filters === "null" ? [] : redisData.filters.split("_"),
                regex: redisData.regex === "null" ? null : redisData.regex,
                filterUsage: redisData.filterUsage
            };
        };

        let data = await this.mongo.getChannelSettings(channelId);
        if(!data) {
            data = await this.mongo.createChannelSettings(channelId, guild);
        };

        let formattedData = {
            id: data.id,
            guild: data.guild,
            registered: parseInt(data.registered),
            limit: data.limit, // Zeit in ms oder Nachrichten Anzahl
            mode: data.mode,
            ignore: data.ignore,
            filters: data.filters,
            regex: data.regex,
            filterUsage: data.filterUsage,
        };

        await this.redis.setHash(`channel_${channelId}`, {
            id: formattedData.id,
            guild: formattedData.guild,
            registered: parseInt(formattedData.registered),
            limit: formattedData.limit, // Zeit in ms oder Nachrichten Anzahl
            mode: formattedData.mode,
            ignore: formattedData.ignore.length >= 1 ? `${formattedData.ignore.join("_")}` : "null",
            filters: formattedData.filters.length >= 1 ? `${formattedData.filters.join("_")}` : "null",
            regex: `${formattedData.regex}`,
            filterUsage: formattedData.filterUsage,
        });
        return formattedData;
    }

    async createChannelSettings(channelId, guild, registered, limit, mode, ignore, filters, regex, filterUsage) {
        await this.deleteChannelSettings(channelId);

        let data = await this.mongo.createChannelSettings(channelId, guild, registered, limit, mode, ignore, filters, regex, filterUsage);

        let formattedData = {
            id: data.id,
            guild: data.guild,
            registered: parseInt(data.registered),
            limit: data.limit, // Zeit in ms oder Nachrichten Anzahl
            mode: data.mode,
            ignore: data.ignore,
            filters: data.filters,
            regex: data.regex,
            filterUsage: data.filterUsage,
        };
        
        await this.redis.setHash(`channel_${channelId}`, {
            id: formattedData.id,
            guild: formattedData.guild,
            registered: parseInt(formattedData.registered),
            limit: formattedData.limit, // Zeit in ms oder Nachrichten Anzahl
            mode: formattedData.mode,
            ignore: formattedData.ignore.length >= 1 ? `${formattedData.ignore.join("_")}` : null,
            filters: formattedData.filters.length >= 1 ? `${formattedData.filters.join("_")}` : null,
            regex: `${formattedData.regex}`,
            filterUsage: formattedData.filterUsage,
        });
        return formattedData;
    };

    async deleteChannelSettings(channelId) {
        await this.redis.deleteKey(`channel_${channelId}`);
        await this.mongo.deleteChannelSettings(channelId);
    };

    async updateChannelSettings(channelId, guild, registered, limit, mode, ignore, filters, regex, filterUsage) {
        let data = await this.mongo.getChannelSettings(channelId);
        let formattedData = {
            id: data.id,
            guild: data.guild,
            registered: parseInt(data.registered),
            limit: data.limit, // Zeit in ms oder Nachrichten Anzahl
            mode: data.mode,
            ignore: data.ignore,
            filters: data.filters,
            regex: data.regex,
            filterUsage: data.filterUsage,
        };

        await this.deleteChannelSettings(channelId);
        return await this.createChannelSettings(channelId, guild, registered || formattedData.registered, limit, mode, ignore, filters, regex, filterUsage);
    };

    async deleteChannelCache(channelId) {
        await this.redis.deleteKey(`channel_${channelId}`);
    };

    async updateChannelCache(channelId) {
        let data = await this.mongo.getChannelSettings(channelId);
        if(!data) {
            data = await this.mongo.createChannelSettings(channelId);
        };

        let formattedData = {
            id: data.id,
            guild: data.guild,
            registered: parseInt(data.registered),
            limit: data.limit, // Zeit in ms oder Nachrichten Anzahl
            mode: data.mode,
            ignore: data.ignore,
            filters: data.filters,
            regex: data.regex,
            filterUsage: data.filterUsage,
        };

        await this.redis.deleteKey(`channel_${channelId}`);
        await this.redis.setHash(`channel_${channelId}`, {
            id: formattedData.id,
            guild: formattedData.guild,
            registered: parseInt(formattedData.registered),
            limit: formattedData.limit, // Zeit in ms oder Nachrichten Anzahl
            mode: formattedData.mode,
            ignore: formattedData.ignore.length >= 1 ? `${formattedData.ignore.join("_")}` : null,
            filters: formattedData.filters.length >= 1 ? `${formattedData.filters.join("_")}` : null,
            regex: `${formattedData.regex}`,
            filterUsage: formattedData.filterUsage,
        });
    };
};

module.exports = DatabaseHandler;