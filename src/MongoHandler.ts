import mongoose from "mongoose";
import { ChannelSettings, GuildSettings, MongoHandlerConfig, UserSettings } from "..";
import Logger from "@eazyautodelete/logger";
import guild from "../schemas/guild";
import channel from "../schemas/channel";
import user from "../schemas/user";

class MongoHandler {
  mongo: typeof mongoose;
  config: MongoHandlerConfig;
  Logger: Logger;
  guild: typeof guild;
  channel: typeof channel;
  user: typeof user;
  constructor(config: MongoHandlerConfig, Logger: Logger) {
    this.mongo = mongoose;
    this.config = config;
    this.Logger = Logger;
    this.guild = guild;
    this.channel = channel;
    this.user = user;
  }

  async connect() {
    await this.mongo.connect(this.config.uri);
  }

  // users
  async getUserSettings(userId: string): Promise<UserSettings | null> {
    const data: UserSettings | null = await this.user.findOne({ id: userId });
    return data
      ? {
          id: data.id,
          registered: data.registered,
          language: data.language,
        }
      : null;
  }

  async updateUserSettings(
    userId: string,
    { lang, registered }: { lang?: string; registered?: number } = {}
  ): Promise<UserSettings> {
    const data =
      (await this.user.findOne({ id: userId })) ||
      (await this.user.create({
        id: userId,
        language: lang,
        registered,
      }));
    const updatedData = await this.user.findOneAndUpdate(
      { id: userId },
      {
        $set: {
          language: lang || data.language,
          registered: registered || data.registered,
        },
      },
      { new: true }
    );
    return {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      id: updatedData!.id,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      registered: updatedData!.registered,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      language: updatedData!.language,
    };
  }

  async createUserSettings(
    userId: string,
    { lang = "en", registered = new Date().getTime() }: { lang?: string; registered?: number } = {}
  ): Promise<UserSettings> {
    const data = await this.user.create({
      id: userId,
      language: lang,
      registered: registered,
    });
    return {
      id: data.id,
      registered: data.registered,
      language: data.language,
    };
  }

  async deleteUserSettings(userId: string): Promise<void> {
    await this.user.deleteOne({ id: userId });
    return;
  }

  // guilds
  async getGuildSettings(guildId: string): Promise<GuildSettings | null> {
    const data: GuildSettings | null = await this.guild.findOne({
      id: guildId,
    });
    return data
      ? {
          id: data.id,
          registered: data.registered,
          prefix: data.prefix,
          premium: data.premium,
          adminroles: data.adminroles,
          modroles: data.modroles,
        }
      : null;
  }

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
    const data =
      (await this.guild.findOne({ id: guildId })) ||
      (await this.guild.create({
        id: guildId,
        registered,
        prefix,
        premium,
        adminroles,
        modroles,
      }));
    const updatedData = await this.guild.findOneAndUpdate(
      { id: guildId },
      {
        $set: {
          registered: registered || data.registered,
          prefix: prefix || data.prefix,
          premium: premium || data.prefix,
          adminroles: adminroles || data.adminroles,
          modroles: modroles || data.modroles,
        },
      },
      { new: true }
    );
    return {
      /* eslint-disable @typescript-eslint/no-non-null-assertion */
      id: updatedData!.id,
      registered: updatedData!.registered,
      prefix: updatedData!.prefix,
      premium: updatedData!.premium,
      adminroles: updatedData!.adminroles,
      modroles: updatedData!.modroles,
    };
  }

  async createGuildSettings(
    guildId: string,
    {
      registered = new Date().getTime(),
      prefix = "%",
      premium = false,
      adminroles = [],
      modroles = [],
    }: {
      registered?: number;
      prefix?: string;
      premium?: boolean;
      adminroles?: Array<string>;
      modroles?: Array<string>;
    } = {}
  ): Promise<GuildSettings> {
    const data = await this.guild.create({
      id: guildId,
      registered: registered,
      prefix: prefix,
      premium: premium,
      adminroles: adminroles,
      modroles: modroles,
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

  async deleteGuildSettings(guildId: string): Promise<void> {
    await this.guild.deleteOne({ id: guildId });
    return;
  }

  // channels
  async getChannelSettings(channelId: string): Promise<ChannelSettings | null> {
    const data: ChannelSettings | null = await this.channel.findOne({
      id: channelId,
    });
    return data
      ? {
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
        }
      : null;
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
    } = {}
  ): Promise<ChannelSettings> {
    const data =
      (await this.channel.findOne({ id: channelId, guild: guild })) ||
      (await this.channel.create({
        id: channelId,
        guild: guild,
        registered: registered,
        limit: limit,
        mode: mode,
        ignore: ignore,
        filters: filters,
        regex: regex,
        filterUsage: filterUsage,
        after: after,
        before: before,
      }));
    const updatedData = await this.channel.findOneAndUpdate(
      { id: channelId, guild: guild },
      {
        $set: {
          registered: registered || data.registered,
          limit: limit === undefined ? data.limit : limit,
          mode: mode === undefined ? data.mode : mode,
          ignore: ignore || data.ignore,
          filters: filters || data.filters,
          regex: regex || data.regex,
          filterUsage: filterUsage || data.filterUsage,
          after: after === undefined ? data.after : after,
          before: before === undefined ? data.before : before,
        },
      },
      { new: true }
    );
    return {
      /* eslint-disable @typescript-eslint/no-non-null-assertion */
      id: updatedData!.id,
      guild: updatedData!.guild as string,
      registered: updatedData!.registered,
      limit: updatedData!.limit,
      mode: updatedData!.mode,
      ignore: updatedData!.ignore,
      filters: updatedData!.filters,
      regex: updatedData?.regex ? new RegExp(updatedData.regex) : null,
      filterUsage: updatedData!.filterUsage,
      after: updatedData!.after,
      before: updatedData!.before,
    };
  }

  async createChannelSettings(
    channelId: string,
    guild: string,
    {
      registered = new Date().getTime(),
      limit = 0,
      mode = 0,
      ignore = [],
      filters = [],
      regex = null,
      filterUsage = "one",
      after = null,
      before = null,
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
    const data = await this.channel.create({
      id: channelId,
      guild: guild,
      registered: registered,
      limit: limit,
      mode: mode,
      ignore: ignore,
      filters: filters,
      regex: regex,
      filterUsage: filterUsage,
      after: after,
      before: before,
    });

    return {
      id: data.id,
      guild: data.guild as string,
      registered: data.registered,
      limit: data.limit,
      mode: data.mode,
      ignore: data.ignore,
      filters: data.filters,
      regex: data?.regex ? new RegExp(data.regex) : null,
      filterUsage: data.filterUsage,
      after: data.after,
      before: data.before,
    };
  }

  async deleteChannelSettings(channelId: string): Promise<void> {
    await this.channel.deleteOne({ id: channelId });
    return;
  }
}

export default MongoHandler;
