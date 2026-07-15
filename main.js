// Matcha Website Scroll-Driven Animation & Simulator Control Logic

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------------------
    // 1. Assets Preloading
    // ----------------------------------------------------------------
    const totalFrames = 51;
    const images = [];
    let loadedCount = 0;

    const preloader = document.getElementById('preloader');
    const loaderBar = document.getElementById('btn-loader-line');
    const loaderText = document.getElementById('btn-text');

    // Helper to format frame numbers (e.g. 1 -> '001')
    function pad(num, size) {
        let s = num + "";
        while (s.length < size) s = "0" + s;
        return s;
    }

    // Preload all frames
    function preloadImages(callback) {
        for (let i = 1; i <= totalFrames; i++) {
            const img = new Image();
            // Path structure matching the uploaded folder
            img.src = `./ezgif-4b17b71040f733af-jpg/ezgif-frame-${pad(i, 3)}.jpg`;
            img.onload = () => {
                loadedCount++;
                const percentage = Math.round((loadedCount / totalFrames) * 100);
                if (loaderBar) loaderBar.style.width = `${percentage}%`;
                if (loaderText) loaderText.textContent = `Loading ${percentage}%`;

                if (loadedCount === totalFrames) {
                    setTimeout(() => {
                        const enterBtn = document.getElementById('enter-experience-btn');
                        if (loaderText) loaderText.textContent = "Get the Glow";
                        if (loaderBar) loaderBar.style.width = "100%";
                        if (enterBtn) {
                            enterBtn.disabled = false;
                            enterBtn.classList.add('ready');
                            enterBtn.addEventListener('click', () => {
                                preloader.classList.add('fade-out');
                                setTimeout(() => {
                                    preloader.style.display = 'none';
                                }, 800);
                            });
                        }
                        callback();
                    }, 300);
                }
            };
            img.onerror = () => {
                console.error(`Failed to load frame ${i}`);
                loadedCount++;
                if (loadedCount === totalFrames) {
                    const enterBtn = document.getElementById('enter-experience-btn');
                    if (loaderText) loaderText.textContent = "Get the Glow";
                    if (enterBtn) {
                        enterBtn.disabled = false;
                        enterBtn.classList.add('ready');
                        enterBtn.addEventListener('click', () => {
                            preloader.classList.add('fade-out');
                            setTimeout(() => {
                                preloader.style.display = 'none';
                            }, 800);
                        });
                    }
                    callback();
                }
            };
            images.push(img);
        }
    }

    // ----------------------------------------------------------------
    // 2. Canvas Setup and Draw Image Prop (Cover-fit)
    // ----------------------------------------------------------------
    const canvas = document.getElementById('matcha-canvas');
    const ctx = canvas.getContext('2d');

    // Draw image to fill canvas (similar to CSS object-fit: cover)
    function drawImageProp(context, img, x, y, w, h, offsetX = 0.5, offsetY = 0.5) {
        if (arguments.length === 2) {
            x = y = 0;
            w = context.canvas.width;
            h = context.canvas.height;
        }

        // Keep aspect ratio
        const iw = img.width,
              ih = img.height,
              r = Math.min(w / iw, h / ih),
              nw = iw * r, // new width
              nh = ih * r; // new height

        let cx, cy, cw, ch, ar = 1;

        // Decide which side to clip
        if (nw < w) ar = w / nw;
        if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh;  // correction

        const w_new = nw * ar;
        const h_new = nh * ar;

        cw = iw / (w_new / w);
        ch = ih / (h_new / h);

        cx = (iw - cw) * offsetX;
        cy = (ih - ch) * offsetY;

        // Make sure parameters are valid
        if (cx < 0) cx = 0;
        if (cy < 0) cy = 0;
        if (cw > iw) cw = iw;
        if (ch > ih) ch = ih;

        context.drawImage(img, cx, cy, cw, ch, x, y, w, h);
    }

    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        renderFrame(); // re-draw current frame on resize
    }

    window.addEventListener('resize', resizeCanvas);

    // Current animation state
    let currentFrameIndex = -1;

    function drawFrame(index) {
        if (images[index]) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high'; // Force high quality scaling
            drawImageProp(ctx, images[index]);
        }
    }

    // ----------------------------------------------------------------
    // 3. Scroll Controller
    // ----------------------------------------------------------------
    const scrollSection = document.getElementById('process');
    
    // Text blocks (including the hero block at the very start)
    const textBlocks = [
        { el: document.getElementById('block-hero'), start: 0.0, end: 0.16 },
        { el: document.getElementById('block-1'), start: 0.20, end: 0.38 },
        { el: document.getElementById('block-2'), start: 0.42, end: 0.60 },
        { el: document.getElementById('block-3'), start: 0.64, end: 0.82 },
        { el: document.getElementById('block-4'), start: 0.86, end: 0.98 }
    ];

    // Smooth scroll interpolation
    function calculateOpacityAndTransform(progress, start, end) {
        if (progress < start || progress > end) {
            return { opacity: 0, translateY: 20 };
        }
        
        // Special handling for the very first section (hero) to start fully visible
        if (start === 0.0) {
            const fadeOutStart = end * 0.5; // Start fading out at 50% of its scroll duration
            if (progress <= fadeOutStart) {
                return { opacity: 1, translateY: 0 };
            } else {
                // Fade-out
                const t = (progress - fadeOutStart) / (end - fadeOutStart);
                return { opacity: 1 - t, translateY: -20 * t };
            }
        }
        
        const duration = end - start;
        const peakStart = start + duration * 0.2;
        const peakEnd = start + duration * 0.8;
        
        let opacity = 0;
        let translateY = 20;

        if (progress >= start && progress < peakStart) {
            // Fade-in
            const t = (progress - start) / (peakStart - start);
            opacity = t;
            translateY = 20 * (1 - t);
        } else if (progress >= peakStart && progress <= peakEnd) {
            // Fully visible
            opacity = 1;
            translateY = 0;
        } else if (progress > peakEnd && progress <= end) {
            // Fade-out
            const t = (progress - peakEnd) / (end - peakEnd);
            opacity = 1 - t;
            translateY = -20 * t; // translate upwards as it leaves
        }

        return { opacity, translateY };
    }

    function renderFrame() {
        const rect = scrollSection.getBoundingClientRect();
        const sectionHeight = rect.height;
        const viewHeight = window.innerHeight;

        // Calculate progress (0 to 1) of the section scroll
        let progress = -rect.top / (sectionHeight - viewHeight);
        progress = Math.max(0, Math.min(1, progress));

        // Map progress to frame index (0 to 50)
        const frameIndex = Math.min(totalFrames - 1, Math.max(0, Math.floor(progress * totalFrames)));
        
        if (currentFrameIndex !== frameIndex) {
            currentFrameIndex = frameIndex;
            drawFrame(currentFrameIndex);
        }

        // Control opacity & translation of narrative text blocks
        textBlocks.forEach(block => {
            const { opacity, translateY } = calculateOpacityAndTransform(progress, block.start, block.end);
            block.el.style.opacity = opacity;
            block.el.style.transform = `translateY(calc(-50% + ${translateY}px))`;
            
            // For center aligned blocks
            if (block.el.classList.contains('center-align')) {
                block.el.style.transform = `translate(-50%, calc(-50% + ${translateY}px))`;
            }
            
            // Enable/disable pointer events to prevent invisible block overlaps
            block.el.style.pointerEvents = opacity > 0.1 ? 'auto' : 'none';
        });
    }

    // Capture scrolling
    window.addEventListener('scroll', () => {
        requestAnimationFrame(renderFrame);
    });

    // Initialize after preloader completes
    preloadImages(() => {
        resizeCanvas();
        renderFrame();
    });

    // ----------------------------------------------------------------
    // 4. Interactive Brewing Simulator
    // ----------------------------------------------------------------
    const tempSlider = document.getElementById('temp-slider');
    const powderSlider = document.getElementById('powder-slider');
    const speedSlider = document.getElementById('speed-slider');

    const tempVal = document.getElementById('temp-val');
    const powderVal = document.getElementById('powder-val');
    const speedVal = document.getElementById('speed-val');

    const resultStatus = document.getElementById('result-status');
    const resultDesc = document.getElementById('result-desc');

    const teaCup = document.getElementById('tea-cup');
    const teaLiquid = document.getElementById('tea-liquid');
    const teaFroth = document.getElementById('tea-froth');
    const steamContainer = document.getElementById('steam-container');
    const whiskBtn = document.getElementById('whisk-action-btn');

    // Update value displays and outcome
    function updateSimulator() {
        const temp = parseInt(tempSlider.value);
        const powder = parseFloat(powderSlider.value);
        const speedIndex = parseInt(speedSlider.value);
        
        const speeds = ["Slow", "Medium", "Whirlwind"];
        const speedText = speeds[speedIndex - 1];

        // Update textual readouts
        tempVal.textContent = `${temp}°C`;
        powderVal.textContent = `${powder.toFixed(1)}g`;
        speedVal.textContent = speedText;

        // Visual simulation styles:
        // 1. Steam based on temperature
        const steamLines = steamContainer.querySelectorAll('.steam-line');
        if (temp < 70) {
            steamLines.forEach(line => line.style.display = 'none');
        } else {
            steamLines.forEach(line => {
                line.style.display = 'block';
                // Adjust animation speed based on temperature
                const duration = Math.max(1, 4 - (temp - 70) / 10);
                line.style.animationDuration = `${duration}s`;
                line.style.background = `rgba(255, 255, 255, ${(temp - 60) / 100 * 0.4})`;
            });
        }

        // 2. Tea liquid color and thickness based on powder
        // Less powder = lighter, more powder = thicker/darker
        let liquidBg;
        let cupBorder = '#233427';
        if (powder < 1.5) {
            liquidBg = 'radial-gradient(circle, #7db38b 0%, #3e6d4c 85%)'; // Light translucent green
        } else if (powder >= 1.5 && powder <= 2.5) {
            liquidBg = 'radial-gradient(circle, #5b966b 0%, #2f563a 80%)'; // Vibrant jade green
        } else {
            liquidBg = 'radial-gradient(circle, #3d6a4a 0%, #173320 85%)'; // Deep thick forest green
            cupBorder = '#1c2d20';
        }
        teaLiquid.style.background = liquidBg;
        teaCup.style.borderColor = cupBorder;

        // 3. Froth opacity and scale based on Whisk Speed and powder quantity
        let frothOpacity = 0.1;
        let frothScale = 0.9;
        
        if (speedIndex === 1) { // Slow
            frothOpacity = powder < 1.5 ? 0.05 : 0.15;
            frothScale = 0.85;
        } else if (speedIndex === 2) { // Medium
            frothOpacity = powder < 1.5 ? 0.2 : 0.5;
            frothScale = 0.95;
        } else { // Whirlwind
            frothOpacity = powder < 1.5 ? 0.35 : 0.85;
            frothScale = 1.05;
        }

        teaFroth.style.opacity = frothOpacity;
        teaFroth.style.transform = `scale(${frothScale})`;

        // Determine brewing narrative outcome
        let status = "Perfect Harmony";
        let desc = "An ideal temperature and dosage. Whisking at medium-to-fast speeds will unlock a smooth, velvety umami froth without any bitter notes.";

        if (temp > 85) {
            status = "Scorched & Bitter";
            desc = "Water is too hot! At over 85°C, the delicate amino acids in the matcha are scorched, resulting in an overly astringent, bitter cup. Try cooling to 80°C.";
            teaLiquid.style.filter = 'hue-rotate(-15deg) saturate(0.85)'; // Shift slightly towards brownish green
        } else if (temp < 70) {
            status = "Luke-warm & Underextracted";
            desc = "The water temperature is too low. The matcha powder won't dissolve properly, leaving a grainy texture and a weak flavor profile. Aim for 75°C - 80°C.";
            teaLiquid.style.filter = 'opacity(0.8)';
        } else {
            teaLiquid.style.filter = 'none';
        }

        if (powder > 2.5 && status === "Perfect Harmony") {
            status = "Rich & Intense (Koicha-style)";
            desc = "A generous dose of matcha! This creates a heavy-bodied, extremely rich liquor. Whisk carefully to incorporate all the powder into a velvety cream.";
        } else if (powder < 1.5 && status === "Perfect Harmony") {
            status = "Thin & Delicate (Light)";
            desc = "A lighter dose. Perfect for a quick refreshing cup, but will have a milder body and less crema. Increase speed to whirlwind to maximize froth.";
        }

        if (speedIndex === 1 && status === "Perfect Harmony") {
            status = "Unwhisked Powder";
            desc = "Temps and dosage are great, but slow whisking fails to create the microfoam cap. The matcha will separate quickly. Whisk in a fast, vigorous 'W' motion!";
        }

        resultStatus.textContent = status;
        resultDesc.textContent = desc;

        // Custom outcomes color
        if (status.includes("Perfect") || status.includes("Rich")) {
            resultStatus.style.color = 'var(--mint-glow)';
            document.querySelector('.simulator-result-box').style.borderColor = 'var(--mint-glow)';
        } else if (status.includes("Scorched") || status.includes("Bitter")) {
            resultStatus.style.color = '#e27c7c';
            document.querySelector('.simulator-result-box').style.borderColor = '#e27c7c';
        } else {
            resultStatus.style.color = 'var(--gold)';
            document.querySelector('.simulator-result-box').style.borderColor = 'var(--gold)';
        }
    }

    // Attach listeners
    tempSlider.addEventListener('input', updateSimulator);
    powderSlider.addEventListener('input', updateSimulator);
    speedSlider.addEventListener('input', updateSimulator);

    // Whisk Button active state animation
    whiskBtn.addEventListener('click', () => {
        whiskBtn.disabled = true;
        whiskBtn.textContent = "Whisking...";
        
        // Add shaking classes
        teaCup.style.animation = "shakeCup 0.15s infinite alternate";
        teaFroth.style.animation = "rotateFroth 0.5s linear infinite";
        
        // Temporarily boost steam
        const steamLines = steamContainer.querySelectorAll('.steam-line');
        steamLines.forEach(line => {
            line.style.animationDuration = '0.4s';
            line.style.opacity = '0.8';
        });

        setTimeout(() => {
            // Stop animations
            teaCup.style.animation = "none";
            teaFroth.style.animation = "rotateFroth 20s linear infinite";
            whiskBtn.disabled = false;
            whiskBtn.textContent = "Whisk Matcha";
            
            // Re-apply correct speed states
            updateSimulator();
            
            // Show toast or subtle effect
            const originalGlow = teaLiquid.style.boxShadow;
            teaLiquid.style.boxShadow = "inset 0 0 30px rgba(123, 241, 168, 0.8), 0 0 15px rgba(123, 241, 168, 0.4)";
            setTimeout(() => {
                teaLiquid.style.boxShadow = originalGlow;
            }, 600);

        }, 1500);
    });

    // CSS shake keyframe created dynamically
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
        @keyframes shakeCup {
            0% { transform: translate(2px, 1px) rotate(0deg); }
            10% { transform: translate(-1px, -2px) rotate(-1deg); }
            20% { transform: translate(-3px, 0px) rotate(1deg); }
            30% { transform: translate(0px, 2px) rotate(0deg); }
            40% { transform: translate(1px, -1px) rotate(1deg); }
            50% { transform: translate(-1px, 2px) rotate(-1deg); }
            60% { transform: translate(-3px, 1px) rotate(0deg); }
            70% { transform: translate(2px, 1px) rotate(-1deg); }
            80% { transform: translate(-1px, -1px) rotate(1deg); }
            90% { transform: translate(2px, 2px) rotate(0deg); }
            100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
    `;
    document.head.appendChild(styleSheet);

    // Initial run
    updateSimulator();
});
