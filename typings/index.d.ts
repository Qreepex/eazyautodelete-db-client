declare module "@eazyautodelete/eazyautodelete-db-client" {
  import mongoose from "mongoose";
  import { Redis } from "ioredis";
  import { Console } from "console";

  export default DatabaseHandler;

  const channel: mongoose.Model<any, {}, {}, {}>;
  const guild: mongoose.Model<any, {}, {}, {}>;
  const user: mongoose.Model<any, {}, {}, {}>;

  export class Logger extends Console {
    constructor();
    /**
     * @param {String} input
     */
    info(input: string, type?: string): void;
    /**
     * @param {String} input
     */
    error(input: string): void;
    /**
     * @param {String} input
     */
    warn(input: string): void;
    date(msTimeStamp?: number): string;
  }

  export class MongoHandler {
    mongo: typeof mongoose;
    config: MongoHandlerConfig;
    Logger: Logger;
    guild: typeof guild;
    channel: typeof channel;
    user: typeof user;
    constructor(config: MongoHandlerConfig, Logger: Logger);
    connect(): Promise<void>;
    getUserSettings(userId: string): Promise<UserSettings>;
    createUserSettings(
      userId: string,
      lang?: UserSettingsLanguage,
      registered?: number
    ): Promise<UserSettings>;
    deleteUserSettings(userId: string): Promise<any>;
    getGuildSettings(guildId: string): Promise<GuildSettings>;
    createGuildSettings(
      guildId: string,
      registered?: number,
      prefix?: string,
      premium?: boolean,
      adminroles?: Array<string>,
      modroles?: Array<string>
    ): Promise<GuildSettings>;
    deleteGuildSettings(guildId: string): Promise<any>;
    getChannelSettings(channelId: string): Promise<ChannelSettings>;
    createChannelSettings(
      channelId: string,
      guild: string,
      registered?: number,
      limit?: number,
      mode?: ModeType,
      ignore?: Array<string>,
      filters?: Array<FilterType>,
      regex?: RegExp | null,
      filterUsage?: FilterUsage
    ): Promise<ChannelSettings>;
    deleteChannelSettings(channelId: string): Promise<any>;
  }

  export class RedisHandler {
    config: RedisHandlerConfig;
    redis: Redis;
    Logger: Logger;
    constructor(config: RedisHandlerConfig, Logger: Logger);
    connect(): Promise<void>;
    getKey(key: string): Promise<string | null>;
    getHashfields(key: string): Promise<Record<string, string>>;
    setHash(
      key: string,
      data: UserSettings | ChannelSettings | GuildSettings | any
    ): Promise<void>;
    deleteKey(key: string): Promise<void>;
  }

  export class DatabaseHandler {
    connected: boolean;
    Logger: Logger;
    mongo: MongoHandler;
    redis: RedisHandler;
    config: DatabaseHandlerConfig;
    constructor(config: DatabaseHandlerConfig, Logger: Logger);
    connect(): Promise<void>;
    getUserSettings(userId: string): Promise<UserSettings>;
    createUserSettings(
      userId: string,
      lang: UserSettingsLanguage,
      registered: number
    ): Promise<UserSettings>;
    deleteUserSettings(userId: string): Promise<void>;
    updateUserSettings(
      userId: string,
      lang: UserSettingsLanguage,
      registered: number
    ): Promise<UserSettings>;
    deleteUserCache(userId: string): Promise<void>;
    updateUserCache(userId: string): Promise<void>;
    getGuildSettings(guildId: string): Promise<GuildSettings>;
    createGuildSettings(
      guildId: string,
      registered?: number,
      prefix?: string,
      premium?: boolean,
      adminroles?: Array<string>,
      modroles?: Array<string>
    ): Promise<{
      id: string;
      registered: number;
      prefix: string;
      premium: boolean;
      adminroles: string[];
      modroles: string[];
    }>;
    deleteGuildSettings(guildId: string): Promise<void>;
    updateGuildSettings(
      guildId: string,
      registered?: number,
      prefix?: string,
      premium?: boolean,
      adminroles?: Array<string>,
      modroles?: Array<string>
    ): Promise<{
      id: string;
      registered: number;
      prefix: string;
      premium: boolean;
      adminroles: string[];
      modroles: string[];
    }>;
    deleteGuildCache(guildId: string): Promise<void>;
    updateGuildCache(guildId: string): Promise<void>;
    getChannelSettings(
      channelId: string,
      guild: string
    ): Promise<ChannelSettings>;
    createChannelSettings(
      channelId: string,
      guild: string,
      registered?: number,
      limit?: number,
      mode?: ModeType,
      ignore?: Array<string>,
      filters?: Array<FilterType>,
      regex?: RegExp | null,
      filterUsage?: FilterUsage
    ): Promise<ChannelSettings>;
    deleteChannelSettings(channelId: string): Promise<void>;
    updateChannelSettings(
      channelId: string,
      guild: string,
      registered?: number,
      limit?: number,
      mode?: ModeType,
      ignore?: Array<string>,
      filters?: Array<FilterType>,
      regex?: RegExp | null,
      filterUsage?: FilterUsage
    ): Promise<ChannelSettings>;
    deleteChannelCache(channelId: string): Promise<void>;
    updateChannelCache(channelId: string, guild: string): Promise<void>;
  }

  export interface DatabaseHandlerConfig {
    redis: RedisHandlerConfig;
    mongo: MongoHandlerConfig;
  }

  export interface MongoHandlerConfig {
    host: string;
    port: number;
    username: string;
    password: string;
    uri: string;
  }

  export interface RedisHandlerConfig {
    host: string;
    port: number;
    password: string;
  }

  export interface UserSettings {
    id: string;
    registered: number;
    language: UserSettingsLanguage;
  }

  export interface ChannelSettings {
    id: string;
    guild: string;
    registered: number;
    limit: number | null; // Zeit in ms oder Nachrichten Anzahl
    mode: number;
    ignore: Array<string>;
    filters: Array<string>;
    regex: null | RegExp;
    filterUsage: FilterUsage;
  }

  export interface GuildSettings {
    id: string;
    prefix: string;
    registered: number;
    premium: boolean;
    adminroles: Array<string>;
    modroles: Array<string>;
  }

  export type UserSettingsLanguage = string;
  /**
                                        "en"    |   // English 
                                        "bg"    |   // Bulgarian
                                        "hr"    |   // Croatian
                                        "cs"    |   // Czech
                                        "da"    |   // Danish 
                                        "nl"    |   // Dutch
                                        "fi"    |   // Finnish
                                        "fr"    |   // French
                                        "de"    |   // German
                                        "el"    |   // Greek
                                        "hi"    |   // Hindi
                                        "hu"    |   // Hungarian
                                        "it"    |   // Italian
                                        "ja"    |   // Japanese
                                        "ko"    |   // Korean
                                        "lt"    |   // Lithuanian
                                        "no"    |   // Norwegian
                                        "pl"    |   // Polish
                                        "pt"    |   // Portuguese
                                        "ro"    |   // Romanian
                                        "ru"    |   // Russian
                                        "es"    |   // Spanish 
                                        "sv-SE" |   // Swedish
                                        "th"    |   // Thai
                                        "tr"    |   // Turkish
                                        "uk"    |   // Ukrainian
                                        "vi";       // Vietnamese*/

  export type FilterType = number; // 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

  export type FilterUsage = string; //"all" | "one"

  export type ModeType = number; //0 | 1 | 2 | 3 | 4;
}
