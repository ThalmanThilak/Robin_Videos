# Robin Videos

Short animated story videos. Use the `story-animator` skill in `.claude/skills/`.
Put every film in its own folder under `stories/`.

## Cloud sessions only
Remotion cannot download its own browser here (the network blocks remotion.media).
Add this flag to every `remotion render` and `remotion still` command:

    --browser-executable=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell

On a local computer, leave the flag out.
