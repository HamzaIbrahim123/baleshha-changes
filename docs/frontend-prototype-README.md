# بلّشها (Baleshha)

RTL Arabic game-night website built from [approved Figma platform designs](https://www.figma.com/design/F8QbCCsYhe27xaDWFygUlK/Untitled?node-id=127-140).

## Run

```bash
npm install
npm run dev
npm run build
```

## Current scope

- One responsive game platform with public browsing and a shared, local demo account.
- Seen Jeem: choose 4, 6 or 8 categories; names of both teams; three helps per team; score controls; question/reveal flow; winning team or tie celebration.
- Account/category question tracking and a resumable match use browser localStorage **for this interactive prototype only**.
- Other game cards (Codenames, لعب الحروف, تحدي الثلاثين) are placeholders for later releases.
- Questions and categories in the current build are **illustrative demo data, not an approved or fact-checked production question bank**.

## Production work remaining

Authentication must be replaced with a real server-side service, hashed passwords stored server-side, rate limits, account sessions and recovery, persistent database (accounts/questions/matches/usage) and question editorial verification. Local demo data is not cross-device and is not suitable for real user credentials. GitHub repositories must never contain credentials or tokens.

Figma Make: use `.figma/make/` for install / preview / deploy.
