# BibleLessonSpark

## About

BibleLessonSpark is a Baptist Bible Study Enhancement Platform that provides AI-powered lesson generation for Baptist churches across America. It creates age-appropriate activities, discussion prompts, and modern applications aligned with SBC, Reformed Baptist, and Independent Baptist theology.

Live site: [biblelessonspark.com](https://biblelessonspark.com)

## Technology Stack

- Vite
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL + Edge Functions)
- Stripe (payments)
- Netlify (hosting, auto-deploy from `main`)

## Local Development

Requires Node.js & npm.

```sh
# Clone the repository
git clone https://github.com/lynn75965/biblelessonspark.git
cd biblelessonspark

# Install dependencies
npm install

# Start the dev server
npm run dev
```

## Deployment

Deploys follow the workflow defined in `CLAUDE.md`: a clean `npm run build`,
local verification on `localhost`, then `.\deploy.ps1 "message"` to push to
`main`, which Netlify auto-deploys.

## Features

- **AI-Generated Lessons**: Age-appropriate content for Kids, Youth, Adults, and Seniors
- **Baptist Theology Aligned**: Respects SBC, Reformed Baptist, and Independent Baptist traditions
- **User Authentication**: Secure login and user management via Supabase
- **Lesson Library**: Save, organize, and manage generated lessons
- **Modern Interface**: Clean, responsive design built with shadcn/ui

## Contact

For support, email: support@biblelessonspark.com
