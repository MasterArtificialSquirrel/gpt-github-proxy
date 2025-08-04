import express from 'express';
import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.post('/push-to-github', async (req, res) => {
  const { repo, branch, path, content, commitMessage, auth } = req.body;

  if (auth !== process.env.SHARED_SECRET) {
    return res.status(401).send('Unauthorized');
  }

  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const [owner, repoName] = repo.split('/');

    // 1. Get SHA of latest commit from develop
    const {
      data: {
        commit: { sha: baseSha }
      }
    } = await octokit.repos.getBranch({
      owner,
      repo: repoName,
      branch: 'develop'
    });

    // 2. Create a new branch
    const newBranch = `${branch || 'auto'}/${Date.now()}`;
    await octokit.git.createRef({
      owner,
      repo: repoName,
      ref: `refs/heads/${newBranch}`,
      sha: baseSha
    });

    // 3. Commit file to the new branch
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo: repoName,
      path,
      message: commitMessage,
      content,
      branch: newBranch
    });

    // 4. Create pull request
    const { data: pr } = await octokit.pulls.create({
      owner,
      repo: repoName,
      title: `Auto PR: ${commitMessage}`,
      head: newBranch,
      base: 'develop',
      body: `This PR was created automatically by the Enoch Dev Architect GPT.`
    });

    res.json({ message: 'Pull request created!', prUrl: pr.html_url });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`GPT proxy running on port ${PORT}`));
