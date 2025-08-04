const axios = require('axios');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

module.exports = async function pushToGitHub({ repo, branch, path, content, commitMessage }) {
  const url = `https://api.github.com/repos/${repo}/contents/${path}`;

  let sha = null;
  try {
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}` }
    });
    sha = data.sha;
  } catch (err) {
    if (err.response?.status !== 404) throw err;
  }

  await axios.put(url, {
    message: commitMessage,
    content,
    branch,
    sha,
  }, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    }
  });
};