import RedisHandler from "./RedisHandler";
import MongoHandler from "./MongoHandler";
import { ChannelSettings, DatabaseHandlerConfig, GuildSettings, UserSettings } from "..";
import Logger from "@eazyautodelete/logger";

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

    this.Logger.info("Databases connected", "DATA");
  }

  async setLastDeleted(channelId: string) {
    await this.redis.setHash(`last_deleted_${channelId}`, {
      last_deleted: new Date().getTime(),
    });
  }

  async getLastDeleted(channelId: string): Promise<number> {
    const data = await this.redis.getHashfields(`last_deleted_${channelId}`);
    if (data?.last_deleted) return parseInt(data.last_deleted);
    return 0;
  }

  // get all active channels
  async getAllActiveChannels(): Promise<string[]> {
    const data: Record<string, string>[] = await this.mongo.channel.find({
      $and: [
        {
          mode: {
            $in: [1, 2, 3, 4],
          },
        },
        {
          limit: {
            $nin: [null, 0],
          },
        },
      ],
    });

    return data.map(y => y.id + "_" + y.guild);
  }

  // user
  // Gets settings from a user
  async getUserSettings(userId: string): Promise<UserSettings> {
    const redisData = await this.redis.getHashfields(`user_${userId}`);
    if (redisData?.id) {
      return {
        id: redisData.id,
        registered: parseInt(redisData.registered),
        language: redisData.language,
      };
    }
    const data = (await this.mongo.getUserSettings(userId)) || (await this.mongo.createUserSettings(userId));

    const formattedData = {
      id: data.id,
      registered: data.registered,
      language: data.language,
    };

    await this.redis.setHash(`user_${userId}`, formattedData);
    return { ...formattedData, isNew: true };
  }

  async getUserSettingsNoCreate(userId: string): Promise<UserSettings | null> {
    const redisData = await this.redis.getHashfields(`user_${userId}`);
    if (redisData?.id) {
      return {
        id: redisData.id,
        registered: parseInt(redisData.registered),
        language: redisData.language,
      };
    }
    const data = await this.mongo.getUserSettings(userId);
    if (!data) return null;

    const formattedData = {
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
    { lang = "en", registered = new Date().getTime() }: { lang?: string; registered?: number } = {}
  ): Promise<UserSettings> {
    const data = await this.mongo.createUserSettings(userId, {
      lang,
      registered,
    });

    await this.redis.setHash(`user_${userId}`, {
      id: data.id,
      registered: data.registered,
      language: data.language,
    });

    return {
      id: data.id,
      registered: data.registered,
      language: data.language,
      isNew: true,
    };
  }

  // Deletes the settings from an user
  async deleteUserSettings(userId: string) {
    await this.redis.deleteKey(`user_${userId}`);
    await this.mongo.deleteUserSettings(userId);
  }

  // Updates the settings from an useer
  async updateUserSettings(
    userId: string,
    { lang, registered }: { lang?: string; registered?: number } = {}
  ): Promise<UserSettings> {
    const data = await this.mongo.updateUserSettings(userId, { lang, registered });
    await this.updateUserCache(userId);

    return {
      id: data.id,
      registered: data.registered,
      language: data.language,
    };
  }

  // Deletes the redis cache from an user
  async deleteUserCache(userId: string): Promise<void> {
    await this.redis.deleteKey(`user_${userId}`);
  }

  // Updates the redis cache from an user
  async updateUserCache(userId: string): Promise<void> {
    const data = (await this.mongo.getUserSettings(userId)) || (await this.mongo.createUserSettings(userId));

    await this.redis.setHash(`user_${userId}`, {
      id: data.id,
      registered: data.registered,
      language: data.language,
    });
  }

  // guilds
  // Gets the settings from a guild
  async getGuildSettings(guildId: string): Promise<GuildSettings> {
    const redisData = await this.redis.getHashfields(`guild_${guildId}`);
    if (redisData?.id) {
      return {
        id: redisData.id,
        registered: parseInt(redisData.registered),
        prefix: redisData.prefix,
        premium: JSON.parse(redisData.premium),
        adminroles: redisData.adminroles === "null" ? [] : redisData.adminroles.split("_"),
        modroles: redisData.modroles === "null" ? [] : redisData.modroles.split("_"),
      };
    }

    const data = (await this.mongo.getGuildSettings(guildId)) || (await this.mongo.createGuildSettings(guildId));

    await this.redis.setHash(`guild_${guildId}`, {
      id: data.id,
      registered: data.registered,
      prefix: data.prefix,
      premium: data.premium,
      adminroles: data.adminroles?.length >= 1 ? data.adminroles.join("_") : "null",
      modroles: data.modroles?.length >= 1 ? data.modroles.join("_") : "null",
    });
    return {
      id: data.id,
      registered: data.registered,
      prefix: data.prefix,
      premium: data.premium,
      adminroles: data.adminroles,
      modroles: data.modroles,
    };
  }

  async getGuildSettingsNoCreate(guildId: string): Promise<GuildSettings | null> {
    const redisData = await this.redis.getHashfields(`guild_${guildId}`);
    if (redisData?.id) {
      return {
        id: redisData.id,
        registered: parseInt(redisData.registered),
        prefix: redisData.prefix,
        premium: JSON.parse(redisData.premium),
        adminroles: redisData.adminroles === "null" ? [] : redisData.adminroles.split("_"),
        modroles: redisData.modroles === "null" ? [] : redisData.modroles.split("_"),
      };
    }

    const data = await this.mongo.getGuildSettings(guildId);
    if (!data) return null;

    await this.redis.setHash(`guild_${guildId}`, {
      id: data.id,
      registered: data.registered,
      prefix: data.prefix,
      premium: data.premium,
      adminroles: data.adminroles?.length >= 1 ? data.adminroles.join("_") : "null",
      modroles: data.modroles?.length >= 1 ? data.modroles.join("_") : "null",
    });
    return {
      id: data.id,
      registered: data.registered,
      prefix: data.prefix,
      premium: data.premium,
      adminroles: data.adminroles,
      modroles: data.modroles,
    };
  }

  // Creates settings for a guild
  async createGuildSettings(
    guildId: string,
    {
      registered,
      prefix,
      premium,
      adminroles,
      modroles,
    }: {
      registered?: number;
      prefix?: string;
      premium?: boolean;
      adminroles?: Array<string>;
      modroles?: Array<string>;
    }
  ): Promise<GuildSettings> {
    const data = await this.mongo.createGuildSettings(guildId, {
      registered,
      prefix,
      premium,
      adminroles,
      modroles,
    });

    await this.redis.setHash(`guild_${guildId}`, {
      id: data.id,
      registered: data.registered,
      prefix: data.prefix,
      premium: data.premium,
      adminroles: data.adminroles?.length >= 1 ? data.adminroles.join("_") : "null",
      modroles: data.modroles?.length >= 1 ? data.modroles.join("_") : "null",
    });

    return {
      id: data.id,
      registered: data.registered,
      prefix: data.prefix,
      premium: data.premium,
      adminroles: data.adminroles,
      modroles: data.modroles,
    };
  }

  // Deletes settings from a guild
  async deleteGuildSettings(guildId: string): Promise<void> {
    await this.redis.deleteKey(`guild_${guildId}`);
    await this.mongo.deleteGuildSettings(guildId);
  }

  // Updates settings from a guild
  async updateGuildSettings(
    guildId: string,
    {
      registered,
      prefix,
      premium,
      adminroles,
      modroles,
    }: {
      registered?: number;
      prefix?: string;
      premium?: boolean;
      adminroles?: Array<string>;
      modroles?: Array<string>;
    } = {}
  ): Promise<GuildSettings> {
    const data = await this.mongo.updateGuildSettings(guildId, {
      registered,
      prefix,
      premium,
      adminroles,
      modroles,
    });
    await this.updateGuildCache(guildId);

    return {
      id: data.id,
      registered: data.registered,
      prefix: data.prefix,
      premium: data.premium,
      adminroles: data.adminroles,
      modroles: data.modroles,
    };
  }

  async deleteGuildCache(guildId: string): Promise<void> {
    await this.redis.deleteKey(`guild_${guildId}`);
  }

  async updateGuildCache(guildId: string): Promise<void> {
    const data = (await this.mongo.getGuildSettings(guildId)) || (await this.mongo.createGuildSettings(guildId));

    await this.redis.setHash(`guild_${guildId}`, {
      id: data.id,
      registered: data.registered,
      prefix: data.prefix,
      premium: data.premium,
      adminroles: data.adminroles?.length >= 1 ? data.adminroles.join("_") : "null",
      modroles: data.modroles?.length >= 1 ? data.modroles.join("_") : "null",
    });
  }

  // channels
  async getChannelSettings(channelId: string, guild: string): Promise<ChannelSettings> {
    const redisData = await this.redis.getHashfields(`channel_${channelId}`);

    if (redisData?.id)
      return {
        id: redisData.id,
        guild: redisData.guild,
        registered: parseInt(redisData.registered),
        limit: parseInt(redisData.limit) || 0, // Zeit in ms oder Nachrichten Anzahl
        mode: parseInt(redisData.mode),
        ignore:
          redisData.ignore === "null" ? [] : redisData.ignore.split("_").length >= 1 ? redisData.ignore.split("_") : [],
        filters:
          redisData.filters === "null"
            ? []
            : redisData.filters.split("_").length >= 1
            ? redisData.filters
                .split("_")
                .filter(x => parseInt(x))
                .map(x => parseInt(x))
            : [],
        regex: redisData.regex === "null" ? null : new RegExp(redisData.regex),
        filterUsage: redisData.filterUsage,
        after: redisData.after === "null" ? null : redisData.after,
        before: redisData.before === "null" ? null : redisData.before,
      };

    const data =
      (await this.mongo.getChannelSettings(channelId)) || (await this.mongo.createChannelSettings(channelId, guild));

    await this.redis.setHash(`channel_${channelId}`, {
      id: data.id,
      guild: data.guild,
      registered: data.registered,
      limit: data.limit, // Zeit in ms oder Nachrichten Anzahl
      mode: data.mode,
      ignore: data.ignore.length >= 1 ? `${data.ignore.join("_")}` : "null",
      filters: data.filters.length >= 1 ? `${data.filters.join("_")}` : "null",
      regex: `${data.regex}`,
      filterUsage: data.filterUsage,
      after: data.after || "null",
      before: data.before || "null",
    });

    return {
      id: data.id,
      guild: data.guild,
      registered: data.registered,
      limit: data.limit, // Zeit in ms oder Nachrichten Anzahl
      mode: data.mode,
      ignore: data.ignore,
      filters: data.filters,
      regex: data.regex,
      filterUsage: data.filterUsage,
      after: data.after,
      before: data.before,
    };
  }

  async getChannelSettingsNoCreate(channelId: string): Promise<ChannelSettings | null> {
    const redisData = await this.redis.getHashfields(`channel_${channelId}`);

    if (redisData?.id)
      return {
        id: redisData.id,
        guild: redisData.guild,
        registered: parseInt(redisData.registered),
        limit: isNaN(parseInt(redisData.limit)) ? 0 : parseInt(redisData.limit), // Zeit in ms oder Nachrichten Anzahl
        mode: parseInt(redisData.mode),
        ignore:
          redisData.ignore === "null" ? [] : redisData.ignore.split("_").length >= 1 ? redisData.ignore.split("_") : [],
        filters:
          redisData.filters === "null"
            ? []
            : redisData.filters.split("_").length >= 1
            ? redisData.filters
                .split("_")
                .filter(x => parseInt(x))
                .map(x => parseInt(x))
            : [],
        regex: redisData.regex === "null" ? null : new RegExp(redisData.regex),
        filterUsage: redisData.filterUsage,
        after: redisData.after === "null" ? null : redisData.after,
        before: redisData.before === "null" ? null : redisData.before,
      };

    const data = await this.mongo.getChannelSettings(channelId);
    if (!data) return null;

    await this.redis.setHash(`channel_${channelId}`, {
      id: data.id,
      guild: data.guild,
      registered: data.registered,
      limit: data.limit, // Zeit in ms oder Nachrichten Anzahl
      mode: data.mode,
      ignore: data.ignore.length >= 1 ? `${data.ignore.join("_")}` : "null",
      filters: data.filters.length >= 1 ? `${data.filters.join("_")}` : "null",
      regex: `${data.regex}`,
      filterUsage: data.filterUsage,
      after: data.after || "null",
      before: data.before || "null",
    });

    return {
      id: data.id,
      guild: data.guild,
      registered: data.registered,
      limit: data.limit, // Zeit in ms oder Nachrichten Anzahl
      mode: data.mode,
      ignore: data.ignore,
      filters: data.filters,
      regex: data.regex,
      filterUsage: data.filterUsage,
      after: data.after,
      before: data.before,
    };
  }

  async createChannelSettings(
    channelId: string,
    guild: string,
    {
      registered,
      limit,
      mode,
      ignore,
      filters,
      regex,
      filterUsage,
      after,
      before,
    }: {
      registered?: number;
      limit?: number;
      mode?: number;
      ignore?: Array<string>;
      filters?: Array<number>;
      regex?: RegExp | null;
      filterUsage?: string;
      after?: string | null;
      before?: string | null;
    } = {}
  ): Promise<ChannelSettings> {
    const data = await this.mongo.createChannelSettings(channelId, guild, {
      registered,
      limit,
      mode,
      ignore,
      filters,
      regex,
      filterUsage,
      after,
      before,
    });

    await this.redis.setHash(`channel_${channelId}`, {
      id: data.id,
      guild: data.guild,
      registered: data.registered,
      limit: data.limit,
      mode: data.mode,
      ignore: data.ignore.length >= 1 ? `${data.ignore.join("_")}` : "null",
      filters: data.filters.length >= 1 ? `${data.filters.join("_")}` : "null",
      regex: `${data.regex}`,
      filterUsage: data.filterUsage,
      after: after || "null",
      before: after || "null",
    });

    return {
      id: data.id,
      guild: data.guild,
      registered: data.registered,
      limit: data.limit,
      mode: data.mode,
      ignore: data.ignore,
      filters: data.filters,
      regex: data.regex,
      filterUsage: data.filterUsage,
      after: data.after,
      before: data.before,
    };
  }

  async deleteChannelSettings(channelId: string): Promise<void> {
    await this.redis.deleteKey(`channel_${channelId}`);
    await this.mongo.deleteChannelSettings(channelId);
  }

  async updateChannelSettings(
    channelId: string,
    guild: string,
    {
      registered,
      limit,
      mode,
      ignore,
      filters,
      regex,
      filterUsage,
      after,
      before,
    }: {
      registered?: number;
      limit?: number;
      mode?: number;
      ignore?: Array<string>;
      filters?: Array<number>;
      regex?: RegExp | null;
      filterUsage?: string;
      after?: string | null;
      before?: string | null;
    }
  ): Promise<ChannelSettings> {
    const data = await this.mongo.updateChannelSettings(channelId, guild, {
      registered,
      limit,
      mode,
      ignore,
      filters,
      regex,
      filterUsage,
      after,
      before,
    });
    await this.updateChannelCache(channelId, guild);

    return {
      id: data.id,
      guild: data.guild,
      registered: data.registered,
      limit: data.limit,
      mode: data.mode,
      ignore: data.ignore,
      filters: data.filters,
      regex: data.regex,
      filterUsage: data.filterUsage,
      after: data.after,
      before: data.before,
    };
  }

  async deleteChannelCache(channelId: string): Promise<void> {
    await this.redis.deleteKey(`channel_${channelId}`);
  }

  async updateChannelCache(channelId: string, guild: string): Promise<void> {
    const data =
      (await this.mongo.getChannelSettings(channelId)) || (await this.mongo.createChannelSettings(channelId, guild));

    await this.redis.setHash(`channel_${channelId}`, {
      id: data.id,
      guild: data.guild,
      registered: data.registered,
      limit: data.limit,
      mode: data.mode,
      ignore: data.ignore.length >= 1 ? `${data.ignore.join("_")}` : "null",
      filters: data.filters.length >= 1 ? `${data.filters.join("_")}` : "null",
      regex: `${data.regex}`,
      filterUsage: data.filterUsage,
      after: data.after || "null",
      before: data.before || "null",
    });
  }
}
