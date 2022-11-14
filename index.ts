import channel from "./schemas/channel";
import guild from "./schemas/guild";
import user from "./schemas/user";
import DatabaseHandler from "./src/DatabaseHandler";
import MongoHandler from "./src/MongoHandler";
import RedisHandler from "./src/RedisHandler";

export { DatabaseHandler, MongoHandler, RedisHandler, channel, guild, user };

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
  language: string;
  isNew?: boolean;
}

export interface ChannelSettings {
  id: string;
  guild: string;
  registered: number;
  limit: number;
  mode: number;
  ignore: Array<string>;
  filters: Array<number>;
  regex: null | RegExp;
  filterUsage: string;
  before: string | null;
  after: string | null;
}

export interface GuildSettings {
  id: string;
  prefix: string;
  registered: number;
  premium: boolean;
  adminroles: Array<string>;
  modroles: Array<string>;
}
