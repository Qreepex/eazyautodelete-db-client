export interface DatabaseHandlerConfig {
	redis:          RedisHandlerConfig,
	mongo:          MongoHandlerConfig,
}

export interface MongoHandlerConfig {
    host:           string,
    port:           number,
    username:       string,
    password:       string,
    uri:            string
}

export interface RedisHandlerConfig {
    host:           string,
    port:           number,
    password:       string
}

export interface UserSettings {
    id:             string,
    registered:     number,
    language:       UserSettingsLanguage
}

export interface ChannelSettings {
    id:             string,
    guild:          string,
    registered:     number,
    limit:          number | null, // Zeit in ms oder Nachrichten Anzahl
    mode:           number,
    ignore:         Array<string>,
    filters:        Array<string>,
    regex:          null | RegExp,
    filterUsage:    FilterUsage
}

export interface GuildSettings {
    id:             string,
    prefix:         string,
    registered:     number,
    premium:        boolean
    adminroles:     Array<string>,
    modroles:       Array<string>
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

export type FilterUsage = string //"all" | "one"

export type ModeType = number //0 | 1 | 2 | 3 | 4;