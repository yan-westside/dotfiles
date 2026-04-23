# dotfiles

Private backup of Claude Code setup — memories, global config, MCP servers, and personal skills.

## What's in here

```
dotfiles/
├── install.sh                        ← run this on a new device
├── claude/
│   ├── CLAUDE.md                     ← global Claude Code instructions
│   ├── settings.template.json        ← MCP configs (fill in API keys)
│   ├── commands/                     ← custom slash commands
│   └── memory/                       ← project memory files
├── skills/
│   ├── coaching/                     ← personal skill
│   └── dr-impact-calc/               ← personal skill
└── mcps/
    ├── assembled/                    ← Assembled MCP server (Node.js)
    ├── google-workspace/             ← Google Workspace MCP
    └── awesome-vibe-coding/          ← Awesome Vibe Coding MCP
```

## New device setup

```bash
git clone https://github.com/yan-westside/dotfiles.git ~/dotfiles
cd ~/dotfiles
chmod +x install.sh
./install.sh
```

Then fill in your API keys in ~/.claude/settings.json and rebuild the MCPs:

```bash
cd ~/.awesome-mcps/assembled && npm install && npm run build
cd ~/.awesome-mcps/google-workspace && npm install && npm run build
```

## Keeping memories in sync

After significant work sessions, commit updated memory files:

```bash
cp ~/.claude/projects/-home-$(whoami)-Projects-cursor-analytics/memory/*.md ~/dotfiles/claude/memory/
cp ~/.claude/projects/-home-$(whoami)-Projects-cursor-analytics/memory/asa_study/*.md ~/dotfiles/claude/memory/asa_study/
cd ~/dotfiles && git add -A && git commit -m "sync memories" && git push
```

## Notes

- settings.template.json has all API keys redacted — fill them in manually after install
- Skills in .cursor/skills/ (org skills) live in the cursor-analytics repo, not here
- Cron jobs are session-only and not backed up
