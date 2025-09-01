// Helper function to load an image and return it as an HTMLImageElement
function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        // Setting crossOrigin is good practice for canvas operations, even with data URLs
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src.substring(0, 50)}...`));
        img.src = src;
    });
}

/**
 * Creates a single "photo album" page image from a collection of decade images.
 * @param imageData A record mapping decade strings to their image data URLs.
 * @returns A promise that resolves to a data URL of the generated album page (JPEG format).
 */
export async function createAlbumPage(imageData: Record<string, string>): Promise<string> {
    const canvas = document.createElement('canvas');
    // High-resolution canvas for good quality (A4-like ratio)
    const canvasWidth = 2480;
    const canvasHeight = 3508;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Could not get 2D canvas context');
    }

    // 1. Draw the album page background
    ctx.fillStyle = '#fdf5e6'; // A warm, parchment-like color
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 2. Draw the title
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';

    ctx.font = `bold 100px 'Caveat', cursive`;
    ctx.fillText('Generated with Nano Banana', canvasWidth / 2, 150);

    ctx.font = `50px 'Roboto', sans-serif`;
    ctx.fillStyle = '#555';
    ctx.fillText('on 时光照相馆', canvasWidth / 2, 220);

    // 3. Load all the polaroid images concurrently
    const decades = Object.keys(imageData);
    const loadedImages = await Promise.all(
        Object.values(imageData).map(url => loadImage(url))
    );

    const imagesWithDecades = decades.map((decade, index) => ({
        decade,
        img: loadedImages[index],
    }));

    // 4. Define grid layout and draw each polaroid
    const grid = { cols: 2, rows: 3, padding: 100 };
    const contentTopMargin = 300; // Space for the header
    const contentHeight = canvasHeight - contentTopMargin;
    const cellWidth = (canvasWidth - grid.padding * (grid.cols + 1)) / grid.cols;
    const cellHeight = (contentHeight - grid.padding * (grid.rows + 1)) / grid.rows;

    // Calculate polaroid dimensions to fit inside the grid cell with a margin
    const polaroidAspectRatio = 1.2; // height is 1.2 times width
    const maxPolaroidWidth = cellWidth * 0.9;
    const maxPolaroidHeight = cellHeight * 0.9;

    let polaroidWidth = maxPolaroidWidth;
    let polaroidHeight = polaroidWidth * polaroidAspectRatio;

    if (polaroidHeight > maxPolaroidHeight) {
        polaroidHeight = maxPolaroidHeight;
        polaroidWidth = polaroidHeight / polaroidAspectRatio;
    }

    const imageContainerWidth = polaroidWidth * 0.9;
    const imageContainerHeight = imageContainerWidth; // Classic square-ish photo area

    // Reverse the drawing order: draw bottom rows first so top rows are rendered on top
    const reversedImages = [...imagesWithDecades].reverse();
    reversedImages.forEach(({ decade, img }, reversedIndex) => {
        // Calculate the original index to determine grid position
        const index = imagesWithDecades.length - 1 - reversedIndex;

        const row = Math.floor(index / grid.cols);
        const col = index % grid.cols;

        // Calculate top-left corner of the polaroid within its grid cell
        const x = grid.padding * (col + 1) + cellWidth * col + (cellWidth - polaroidWidth) / 2;
        const y = contentTopMargin + grid.padding * (row + 1) + cellHeight * row + (cellHeight - polaroidHeight) / 2;

        ctx.save();

        // Translate context to the center of the polaroid for rotation
        ctx.translate(x + polaroidWidth / 2, y + polaroidHeight / 2);

        // Apply a slight, random rotation for a hand-placed look
        const rotation = (Math.random() - 0.5) * 0.1; // Radians (approx. +/- 2.8 degrees)
        ctx.rotate(rotation);

        // Draw a soft shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 35;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 10;

        // Draw the white polaroid frame (centered at the new origin)
        ctx.fillStyle = '#fff';
        ctx.fillRect(-polaroidWidth / 2, -polaroidHeight / 2, polaroidWidth, polaroidHeight);

        // Remove shadow for subsequent drawing
        ctx.shadowColor = 'transparent';

        // Calculate image dimensions to fit while maintaining aspect ratio
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        let drawWidth = imageContainerWidth;
        let drawHeight = drawWidth / aspectRatio;

        if (drawHeight > imageContainerHeight) {
            drawHeight = imageContainerHeight;
            drawWidth = drawHeight * aspectRatio;
        }

        // Calculate position to center the image within its container area
        const imageAreaTopMargin = (polaroidWidth - imageContainerWidth) / 2;
        const imageContainerY = -polaroidHeight / 2 + imageAreaTopMargin;

        const imgX = -drawWidth / 2; // Horizontally centered due to context translation
        const imgY = imageContainerY + (imageContainerHeight - drawHeight) / 2;

        ctx.drawImage(img, imgX, imgY, drawWidth, drawHeight);

        // Draw the handwritten caption
        ctx.fillStyle = '#222';
        ctx.font = `60px 'Permanent Marker', cursive`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const captionAreaTop = imageContainerY + imageContainerHeight;
        const captionAreaBottom = polaroidHeight / 2;
        const captionY = captionAreaTop + (captionAreaBottom - captionAreaTop) / 2;

        ctx.fillText(decade, 0, captionY);

        ctx.restore(); // Restore context to pre-transformation state
    });

    // Convert canvas to a high-quality JPEG and return the data URL
    return canvas.toDataURL('image/jpeg', 0.9);
}
