const express = require('express');
const axios = require('axios');
const redis = require('redis');

const PORT = 5000;
const REDIS_PORT = 6379;

const client = redis.createClient(REDIS_PORT);

const app = express();

const getRepos = async (req, res, next) => {
  try {
    const { username } = req.params;
    const data = await getOrSetCache(username, async () => {
      console.log('Fetching...');
      const response = await axios.get(
        `https://api.github.com/users/${username}`
      );
      const data = response.data;
      return data;
    });
    res.status(200).json({
      data,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

function getOrSetCache(key, cb) {
  return new Promise((resolve, reject) => {
    client.get(key, async (error, data) => {
      if (error) {
        return reject(error);
      }
      if (data != null) {
        console.log('chached');
        return resolve(JSON.parse(data));
      }
      const freshData = await cb();
      client.setex(key, 3600, JSON.stringify(freshData));
      resolve(freshData);
    });
  });
}

// cached middleware
app.get('/repos/:username', getRepos);

app.listen(PORT, () => {
  console.log(`app running on port ${PORT}`);
});
