const express = require('express');
const bodyParser = require('body-parser');
const pushToGitHub = require('./utils/github');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/push-to-github', async (req, res) => {
  const { repo, branch, path, content, commitMessage, auth } = req.body;

  if (auth !== process.env.SHARED_SECRET) {
    return res.status(401).send('Unauthorized');
  }

  try {
    await pushToGitHub({ repo, branch, path, content, commitMessage });
    res.status(200).send('Commit successful');
  } catch (error) {
    console.error(error);
    res.status(500).send('Commit failed');
  }
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));