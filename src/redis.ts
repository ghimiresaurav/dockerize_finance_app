import { createClient, RedisClientType } from "redis";

let redisClient: null | RedisClientType = null;

(async () => {
  redisClient = createClient({
    url: process.env.REDIS_URL || "redis://redis:6379",
  });
  redisClient.on("error", (err: any) => console.log("Redis Client Error", err));

  await redisClient.connect();
})();

export default redisClient;
