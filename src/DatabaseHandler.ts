import RedisHandler from "./RedisHandler";
import MongoHandler from "./MongoHandler";
import {
  ChannelSettings,
  DatabaseHandlerConfig,
  FilterType,
  FilterUsage,
  GuildSettings,
  ModeType,
  UserSettings,
  UserSettingsLanguage,
} from "../typings";
import Logger from "../utils/Logger";

export default class DatabaseHandler {
  connected: boolean;
  Logger: Logger;
  mongo: MongoHandler;
  redis: RedisHandler;
  config: DatabaseHandlerConfig;
  constructor(config: DatabaseHandlerConfig, Logger: Logger) {
    this.connected = false;
    this.Logger = Logger;
    this.mongo = new MongoHandler(config.mongo, this.Logger);
    this.redis = new RedisHandler(config.redis, this.Logger);
    this.config = config;
  }

  // Connects the databases
  async connect() {
    await this.mongo.connect();
    await this.redis.connect();

    this.connected = true;

    this.Logger.info("🧰 Databases connected", "DATA");
  }

  // user
  // Gets settings from a user
  async getUserSettings(userId: string): Promise<UserSettings> {
    let redisData = await this.redis.getHashfields(`user_${userId}`);
    if (redisData?.id) {
      let returnData: UserSettings = {
        id: redisData.id,
        registered: parseInt(redisData.registered),
        language: redisData.language,
      };
      return returnData;
    }
    let data = await this.mongo.getUserSettings(userId);
    if (!data) {
      data = await this.mongo.createUserSettings(userId);
    }

    let formattedData: UserSettings = {
      id: data.id,
      registered: data.registered,
      language: data.language,
    };

    await this.redis.setHash(`user_${userId}`, formattedData);
    return formattedData;
  }

  // Creates settings for a user
  async createUserSettings(
    userId: string,
    lang: UserSettingsLanguage,
    registered: number
  ): Promise<UserSettings> {
    await this.deleteUserSettings(userId);

    let data = await this.mongo.createUserSettings(userId, lang, registered);

    let formattedData: UserSettings = {
      id: data.id,
      registered: data.registered,
      language: data.language,
    };

    await this.redis.setHash(`user_${userId}`, formattedData);
    return formattedData;
  }

  // Deletes the settings from an user
  async deleteUserSettings(userId: string) {
    await this.redis.deleteKey(`user_${userId}`);
    await this.mongo.deleteUserSettings(userId);
  }

  // Updates the settings from an useer
  async updateUserSettings(
    userId: string,
    lang: UserSettingsLanguage,
    registered: number
  ): Promise<UserSettings> {
    let data = await this.mongo.getUserSettings(userId);
    let formattedData: UserSettings = {
      id: data?.id,
      registered: data?.registered,
      language: data?.language,
    };
    if (
      formattedData.language === lang &&
      formattedData.registered === registered
    )
      return formattedData;

    await this.deleteUserSettings(userId);
    return await this.createUserSettings(userId, lang, registered);
  }

  // Deletes the redis cache from an user
  async deleteUserCache(userId: string): Promise<void> {
    await this.redis.deleteKey(`user_${userId}`);
  }

  // Updates the redis cache from an user
  async updateUserCache(userId: string): Promise<void> {
    let data = await this.mongo.getUserSettings(userId);
    if (!data) {
      data = await this.mongo.createUserSettings(userId);
    }

    let formattedData: UserSettings = {
      id: data.id,
      registered: data.registered,
      language: data.language,
    };

    await this.redis.setHash(`user_${userId}`, formattedData);
  }

  // guilds
  // Gets the settings from a guild
  async getGuildSettings(guildId: string): Promise<GuildSettings> {
    let redisData = await this.redis.getHashfields(`guild_${guildId}`);

    if (redisData?.id) {
      let returnData: GuildSettings = {
        id: redisData.id,
        registered: parseInt(redisData.registered),
        prefix: redisData.prefix,
        premium: JSON.parse(redisData.premium),
        adminroles:
          redisData.adminroles === "null"
            ? []
            : redisData.adminroles.split("_"),
        modroles:
          redisData.modroles === "null" ? [] : redisData.modroles.split("_"),
      };
      return returnData;
    }

    let data = await this.mongo.getGuildSettings(guildId);
    if (!data) {
      data = await this.mongo.createGuildSettings(guildId);
    }

    let formattedData: GuildSettings = {
      id: data.id,
      registered: data.registered,
      prefix: data.prefix,
      premium: data.premium,
      adminroles: data.adminroles,
      modroles: data.modroles,
    };

    await this.redis.setHash(`guild_${guildId}`, {
      id: formattedData.id,
      registered: formattedData.registered,
      prefix: formattedData.prefix,
      premium: formattedData.premium,
      adminroles: `${
        formattedData.adminroles?.length >= 1
          ? formattedData.adminroles.join("_")
          : null
      }`,
      modroles: `${
        formattedData.modroles?.length >= 1
          ? formattedData.modroles.join("_")
          : null
      }`,
    });
    return formattedData;
  }

  // Creates settings for a guild
  async createGuildSettings(
    guildId: string,
    registered: number = new Date().getTime(),
    prefix: string = "%",
    premium: boolean = false,
    adminroles: Array<string> = [],
    modroles: Array<string> = []
  ): Promise<GuildSettings> {
    await this.deleteGuildSettings(guildId);

    let data = await this.mongo.createGuildSettings(
      guildId,
      registered,
      prefix,
      premium,
      adminroles,
      modroles
    );

    let formattedData = {
      id: data.id,
      registered: data.registered,
      prefix: data.prefix,
      premium: data.premium,
      adminroles: data.adminroles,
      modroles: data.modroles,
    };

    await this.redis.setHash(`guild_${guildId}`, {
      id: formattedData.id,
      registered: formattedData.registered,
      prefix: formattedData.prefix,
      premium: formattedData.premium,
      adminroles: `${
        formattedData.adminroles?.length >= 1
          ? formattedData.adminroles.join("_")
          : null
      }`,
      modroles: `${
        formattedData.modroles?.length >= 1
          ? formattedData.modroles.join("_")
          : null
      }`,
    });
    return formattedData;
  }

  // Deletes settings from a guild
  async deleteGuildSettings(guildId: string): Promise<void> {
    await this.redis.deleteKey(`guild_${guildId}`);
    await this.mongo.deleteGuildSettings(guildId);
  }

  // Updates settings from a guild
  async updateGuildSettings(
    guildId: string,
    registered: number = new Date().getTime(),
    prefix: string = "%",
    premium: boolean = false,
    adminroles: Array<string> = [],
    modroles: Array<string> = []
  ): Promise<GuildSettings> {
    let data = await this.mongo.getGuildSettings(guildId);
    let formattedData = {
      id: data.id,
      registered: data.registered,
      prefix: data.prefix,
      premium: data.premium,
      adminroles: data.adminroles,
      modroles: data.modroles,
    };

    await this.deleteGuildSettings(guildId);
    return await this.createGuildSettings(
      guildId,
      registered || formattedData.registered,
      prefix,
      premium,
      adminroles,
      modroles
    );
  }

  async deleteGuildCache(guildId: string): Promise<void> {
    await this.redis.deleteKey(`guild_${guildId}`);
  }

  async updateGuildCache(guildId: string): Promise<void> {
    let data = await this.mongo.getGuildSettings(guildId);
    if (!data) {
      data = await this.mongo.createGuildSettings(guildId);
    }

    let formattedData = {
      id: data.id,
      registered: data.registered,
      prefix: data.prefix,
      premium: data.premium,
      adminroles: data.adminroles,
      modroles: data.modroles,
    };

    await this.redis.setHash(`guild_${guildId}`, {
      id: formattedData.id,
      registered: formattedData.registered,
      prefix: formattedData.prefix,
      premium: formattedData.premium,
      adminroles: `${
        formattedData.adminroles?.length >= 1
          ? formattedData.adminroles.join("_")
          : null
      }`,
      modroles: `${
        formattedData.modroles?.length >= 1
          ? formattedData.modroles.join("_")
          : null
      }`,
    });
  }

  // channels
  async getChannelSettings(
    channelId: string,
    guild: string
  ): Promise<ChannelSettings> {
    let redisData = await this.redis.getHashfields(`channel_${channelId}`);

    if (redisData?.id) {
      let returnData: ChannelSettings = {
        id: redisData.id,
        guild: redisData.guild,
        registered: parseInt(redisData.registered),
        limit: isNaN(parseInt(redisData.limit))
          ? null
          : parseInt(redisData.limit), // Zeit in ms oder Nachrichten Anzahl
        mode: parseInt(redisData.mode),
        ignore: redisData.ignore === "null" ? [] : redisData.ignore.split("_"),
        filters:
          redisData.filters === "null" ? [] : redisData.filters.split("_"),
        regex: redisData.regex === "null" ? null : new RegExp(redisData.regex),
        filterUsage: redisData.filterUsage,
      };
      return returnData;
    }

    let data = await this.mongo.getChannelSettings(channelId);
    if (!data) {
      data = await this.mongo.createChannelSettings(channelId, guild);
    }

    let formattedData = {
      id: data.id,
      guild: data.guild,
      registered: data.registered,
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
      registered: formattedData.registered,
      limit: formattedData.limit, // Zeit in ms oder Nachrichten Anzahl
      mode: formattedData.mode,
      ignore:
        formattedData.ignore.length >= 1
          ? `${formattedData.ignore.join("_")}`
          : "null",
      filters:
        formattedData.filters.length >= 1
          ? `${formattedData.filters.join("_")}`
          : "null",
      regex: `${formattedData.regex}`,
      filterUsage: formattedData.filterUsage,
    });
    return formattedData;
  }

  async createChannelSettings(
    channelId: string,
    guild: string,
    registered: number = new Date().getTime(),
    limit: number = 0,
    mode: ModeType = 0,
    ignore: Array<string> = [],
    filters: Array<FilterType> = [],
    regex: RegExp | null = null,
    filterUsage: FilterUsage = "one"
  ): Promise<ChannelSettings> {
    await this.deleteChannelSettings(channelId);

    let data = await this.mongo.createChannelSettings(
      channelId,
      guild,
      registered,
      limit,
      mode,
      ignore,
      filters,
      regex,
      filterUsage
    );

    let formattedData = {
      id: data.id,
      guild: data.guild,
      registered: data.registered,
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
      registered: formattedData.registered,
      limit: formattedData.limit, // Zeit in ms oder Nachrichten Anzahl
      mode: formattedData.mode,
      ignore:
        formattedData.ignore.length >= 1
          ? `${formattedData.ignore.join("_")}`
          : null,
      filters:
        formattedData.filters.length >= 1
          ? `${formattedData.filters.join("_")}`
          : null,
      regex: `${formattedData.regex}`,
      filterUsage: formattedData.filterUsage,
    });
    return formattedData;
  }

  async deleteChannelSettings(channelId: string): Promise<void> {
    await this.redis.deleteKey(`channel_${channelId}`);
    await this.mongo.deleteChannelSettings(channelId);
  }

  async updateChannelSettings(
    channelId: string,
    guild: string,
    registered: number = new Date().getTime(),
    limit: number = 0,
    mode: ModeType = 0,
    ignore: Array<string> = [],
    filters: Array<FilterType> = [],
    regex: RegExp | null = null,
    filterUsage: FilterUsage = "one"
  ): Promise<ChannelSettings> {
    let data = await this.mongo.getChannelSettings(channelId);
    let formattedData = {
      id: data.id,
      guild: data.guild,
      registered: data.registered,
      limit: data.limit, // Zeit in ms oder Nachrichten Anzahl
      mode: data.mode,
      ignore: data.ignore,
      filters: data.filters,
      regex: data.regex,
      filterUsage: data.filterUsage,
    };

    await this.deleteChannelSettings(channelId);
    return await this.createChannelSettings(
      channelId,
      guild,
      registered || formattedData.registered,
      limit,
      mode,
      ignore,
      filters,
      regex,
      filterUsage
    );
  }

  async deleteChannelCache(channelId: string): Promise<void> {
    await this.redis.deleteKey(`channel_${channelId}`);
  }

  async updateChannelCache(channelId: string, guild: string): Promise<void> {
    let data = await this.mongo.getChannelSettings(channelId);
    if (!data) {
      data = await this.mongo.createChannelSettings(channelId, guild);
    }

    let formattedData = {
      id: data.id,
      guild: data.guild,
      registered: data.registered,
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
      registered: formattedData.registered,
      limit: formattedData.limit, // Zeit in ms oder Nachrichten Anzahl
      mode: formattedData.mode,
      ignore:
        formattedData.ignore.length >= 1
          ? `${formattedData.ignore.join("_")}`
          : null,
      filters:
        formattedData.filters.length >= 1
          ? `${formattedData.filters.join("_")}`
          : null,
      regex: `${formattedData.regex}`,
      filterUsage: formattedData.filterUsage,
    });
  }
}
