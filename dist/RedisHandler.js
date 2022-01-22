const redis = require("ioredis");

class RedisHandler {
    constructor(config, Logger) {
        this.redis;
        this.config = config;
        this.Logger = Logger;
    };

    async connect() {
        this.redis = new redis(
            this.config.port, this.config.host, {
                password: this.config.password,
            },
        );
    };

    getKey(key) {
        return this.redis.get(key).then(data => {
            return data;
        });
    };

    getHashfields(key) {
        return this.redis.hgetall(key).then(data => {
            return data;
        });
    };

    async setHash(key, data) {
        const fields = Object.keys(data);
        if (fields.length > 1)
            await this.redis.hmset(key, ...fields.map((field) => [field, data[field]]).flat());
        else
            await this.redis.hset(key, fields[0], data[fields[0]]);
    };

    async deleteKey(key) {
        await this.redis.del(key);
    };
};

module.exports = RedisHandler;