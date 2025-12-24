App Specification: MatrixForge (Client-Side)
Core Philosophy: "What happens in the browser, stays in the browser." No servers, no databases. Simplicity and modern visuals.

1. The Workflow
Select Grid: User chooses 2x2, 3x3, or 4x4 from a dropdown.

Input Data: A grid of input boxes appears. You type the numbers directly (e.g., 202, 1, 31...). Support tab navigation to move through the grid.

Upload Texture: User uploads a background image (e.g., the Chest X-Ray).

Style: Adjust colors, opacity, and text.

Download: Click a button to save the high-res PNG.

2. Feature Breakdown
A. The Matrix Engine (Logic)

Dynamic Grid: Changing from 3x3 to 4x4 instantly adds/removes rows and columns in the UI without refreshing.

Auto-Math:

Summation: It automatically sums the rows and columns to determine the heatmap intensity.
Global Max Colors: Heatmap intensity is calculated based on the global maximum value in the grid, not per row/column.

Accuracy Calculation: It sums the diagonal (True Positives) and divides by the grand total to display: "Accuracy: 94.2%".

B. The "X-Ray" Visualizer (Graphics)

The "Cookie Cutter" Effect:
The app uses CSS Masking or solid overlays. The user's uploaded image is placed in a container. The "Tiles" act as windows (masks) that reveal the image only where the squares are. The area outside the tiles should be solid/hidden.

Image Fitting:
Uploaded images must not stretch. They should fit horizontally or vertically (whichever is smaller) within the container (object-fit: contain behavior).

Heatmap Blending:

Layer 1 (Bottom): The User's Image.

Layer 2 (Middle): The Heatmap Color (e.g., Blue to Yellow). This layer has an Opacity Slider (0-100%).

Layer 3 (Top): The Numbers and Text.

C. Customization Controls

Colors: Two color pickers (Low Value, High Value).

Text:

Font Color Picker.

Font Size Slider.

"Stroke/Shadow" Toggle: A crucial feature. If the background image is complex (like bones), white text might be hard to read. This adds a black outline to the numbers to ensure they pop.

Labels: 
- General Labels: "Predicted" and "True" labels are premade/standard.
- Individual Labels: Empty by default, to be filled by the user.

3. Technical Architecture (For GitHub Pages)
Tech Stack: Vanilla HTML, CSS, and JavaScript. No complex frameworks (No React, No Vite).

Why? Simplicity and ease of deployment.

Image Generation: html-to-image (via CDN or local script).
This is a JavaScript library that takes a "screenshot" of a specific <div> on your page and saves it as a PNG. This ensures the downloaded image looks exactly like the one on screen.

Deployment: GitHub Actions (Simple static site deployment).