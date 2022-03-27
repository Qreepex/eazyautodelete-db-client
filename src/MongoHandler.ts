import mongoose, { Mongoose } from "mongoose";
import {
  ChannelSettings,
  FilterType,
  FilterUsage,
  GuildSettings,
  ModeType,
  MongoHandlerConfig,
  UserSettings,
  UserSettingsLanguage,
} from "../typings";
import Logger from "../utils/Logger";
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
  async getUserSettings(userId: string): Promise<UserSettings> {
    const data: UserSettings = await this.user.findOne({ id: userId });
    return data;
  }

  async createUserSettings(
    userId: string,
    lang: UserSettingsLanguage = "en",
    registered: number = new Date().getTime()
  ): Promise<UserSettings> {
    const data: UserSettings = await this.user.create({
      id: userId,
      language: lang,
      registered: registered,
    });
    return data;
  }

  async deleteUserSettings(userId: string): Promise<any> {
    const data = await this.user.deleteMany({ id: userId });
    return data;
  }

  // guilds
  async getGuildSettings(guildId: string): Promise<GuildSettings> {
    const data: GuildSettings = await this.guild.findOne({ id: guildId });
    return data;
  }

  async createGuildSettings(
    guildId: string,
    registered: number = new Date().getTime(),
    prefix: string = "%",
    premium: boolean = false,
    adminroles: Array<string> = [],
    modroles: Array<string> = []
  ): Promise<GuildSettings> {
    const data: GuildSettings = await this.guild.create({
      id: guildId,
      registered: registered,
      prefix: prefix,
      premium: premium,
      adminroles: adminroles,
      modroles: modroles,
    });
    return data;
  }

  async deleteGuildSettings(guildId: string): Promise<any> {
    const data = await this.guild.deleteMany({ id: guildId });
    return data;
  }

  // channels
  async getChannelSettings(channelId: string): Promise<ChannelSettings> {
    const data: ChannelSettings = await this.channel.findOne({ id: channelId });
    return data;
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
    const data: ChannelSettings = await this.channel.create({
      id: channelId,
      guild: guild,
      registered: registered,
      limit: limit,
      mode: mode,
      ignore: ignore,
      filters: filters,
      regex: regex,
      filterUsage: filterUsage,
    });
    return data;
  }

  async deleteChannelSettings(channelId: string): Promise<any> {
    const data = await this.channel.deleteMany({ id: channelId });
    return data;
  }
}

export default MongoHandler;
