const redis = require('redis');

const REDIS_USERNAME = process.env.REDIS_USERNAME;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT;


const redisCli_cloud = redis.createClient({
    url:`redis://${REDIS_USERNAME}:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}/0`,
    legacyMode: true,
})
redisCli_cloud.on('connect', () => {
    console.info('Redis connected!');
 });
 redisCli_cloud.on('error', (err) => {
    console.error('Redis Client Error', err);
 });
 redisCli_cloud.connect().then();
 const redisClient_EmailCode = redisCli_cloud.v4;

const redisCli_local = redis.createClient({ legacyMode: true });
redisCli_local.on('connect', () => {
    console.info('Redis_local connected!');
 });
 redisCli_local.on('error', (err) => {
    console.error('Redis_local Client Error', err);
 });
 redisCli_local.connect().then();
 const redisClient_EmailRToken = redisCli_local.v4;


 module.exports = {
    redisClient_EmailCode,
    redisClient_EmailRToken
 }