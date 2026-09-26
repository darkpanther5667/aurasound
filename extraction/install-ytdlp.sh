# yt-dlp installation script for Render / Linux CI environments
# Called during build to ensure yt-dlp is available at runtime

set -e

echo "==> Installing yt-dlp..."

# Try system-wide install (works on Render)
if curl -fsSL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp 2>/dev/null; then
  chmod +x /usr/local/bin/yt-dlp
  echo "✓ yt-dlp installed to /usr/local/bin/yt-dlp"
  yt-dlp --version
else
  # Fallback: install to local bin
  mkdir -p $HOME/.local/bin
  curl -fsSL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o $HOME/.local/bin/yt-dlp
  chmod +x $HOME/.local/bin/yt-dlp
  export PATH="$HOME/.local/bin:$PATH"
  echo "✓ yt-dlp installed to $HOME/.local/bin/yt-dlp"
  yt-dlp --version
fi
