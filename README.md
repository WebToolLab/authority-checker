
# OpenPageRank Checker

A bulk OpenPageRank checker with:

- GitHub Pages frontend
- Vercel serverless backend
- OpenPageRank API integration
- CSV export
- Responsive design

## Features

- Check up to 100 domains per request
- View OpenPageRank scores
- View global rank
- View referring domains
- Export results to CSV
- Secure API key storage on the backend

## Project Structure

```text
openpagerank-checker/
├── docs/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── api/
│   └── check.js
├── .gitignore
├── vercel.json
└── README.md
```

## Deployment

1. Upload the repository to GitHub.
2. Enable GitHub Pages from the docs folder.
3. Deploy the repository on Vercel.
4. Configure the environment variables.
5. Update the frontend API URL.
6. Push the changes to GitHub.

## API Environment Variables

```text
OPR_API_KEY=your_openpagerank_key
FRONTEND_ORIGIN=https://your-github-username.github.io
```

## Important

This project displays OpenPageRank metrics.

It does not calculate or retrieve Moz DA, Moz PA, or Spam Score.

The API key must be stored in the backend environment and should never be committed to the public repository.
