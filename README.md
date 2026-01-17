# MatrixForge ⚒️

Ever needed to create a stunning confusion matrix with a custom background image showing through? Yeah, me too. That's why MatrixForge exists.

![MatrixForge Screenshot](/assets/screenshot.png)

## What is this?

MatrixForge lets you build beautiful confusion matrices right in your browser. Upload an X-ray, medical scan, or any image, and watch it peek through your matrix tiles like magic. No installation, no servers, no fuss—just open and go.

## Cool Stuff It Does

- **Works offline** - Everything runs in your browser, no server needed
- **Flexible grids** - Switch between 2x2, 3x3, and 4x4 on the fly
- **Image masking** - Your background image shows through the matrix tiles (the "cookie cutter" effect)
- **Smart calculations** - Automatically computes accuracy and generates heatmaps based on your data
- **Full customization** - Tweak colors, opacity, fonts, and spacing to match your style
- **Export ready** - Download high-resolution PNGs for your presentations

## Getting Started

Just open [index.html](index.html) in any modern browser. That's it!

Type your confusion matrix values, upload a background image if you want, adjust the colors and styles, then hit download when you're happy with it.

## Deploying

Want to host this on GitHub Pages? Easy:
1. Push this repo to GitHub
2. Go to Settings → Pages
3. Set source to the `main` branch
4. Done! Your site is live

## Under the Hood

Built with vanilla JavaScript, HTML, and CSS. Uses [html-to-image](https://github.com/bubkoo/html-to-image) for generating those crispy PNG exports.
