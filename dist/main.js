// Matcha Website Scroll-Driven Animation & Simulator Control Logic

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------------------
    // 1. Assets Preloading
    // ----------------------------------------------------------------
    const totalFrames = 47;
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
            img.src = `./ezgif-4601c917dc2958a0-jpg/ezgif-frame-${pad(i, 3)}.jpg`;
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

    // ----------------------------------------------------------------
    // 5. Header Scroll Effect
    // ----------------------------------------------------------------
    const header = document.querySelector('header');
    function checkHeaderScroll() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
    window.addEventListener('scroll', checkHeaderScroll);
    checkHeaderScroll(); // Run once in case page loads scrolled down

    // ----------------------------------------------------------------
    // 6. Mobile Menu Overlay Logic
    // ----------------------------------------------------------------
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

    if (mobileMenuBtn && mobileMenuOverlay) {
        mobileMenuBtn.addEventListener('click', () => {
            const isActive = mobileMenuBtn.classList.toggle('active');
            mobileMenuOverlay.classList.toggle('active');
            mobileMenuBtn.setAttribute('aria-expanded', isActive);
            // Disable scroll when mobile menu is open
            document.body.style.overflow = isActive ? 'hidden' : '';
        });

        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuBtn.classList.remove('active');
                mobileMenuOverlay.classList.remove('active');
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            });
        });
    }

    // ----------------------------------------------------------------
    // 7. Premium E-commerce Cart Logic
    // ----------------------------------------------------------------
    let cart = [];
    const cartDrawer = document.getElementById('cart-drawer');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartCloseBtn = document.getElementById('cart-close-btn');
    const openCartBtn = document.getElementById('header-cart-btn');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalBadge = document.getElementById('cart-count');
    const cartTotalCountText = document.getElementById('cart-total-count');
    const cartSubtotalText = document.getElementById('cart-subtotal');
    const checkoutBtn = document.getElementById('cart-checkout-btn');
    const toast = document.getElementById('toast-notification');

    function showToast(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('active');
        setTimeout(() => {
            toast.classList.remove('active');
        }, 2500);
    }

    function toggleCart(isOpen) {
        if (!cartDrawer) return;
        if (isOpen) {
            cartDrawer.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            cartDrawer.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    if (openCartBtn) openCartBtn.addEventListener('click', () => toggleCart(true));
    if (cartCloseBtn) cartCloseBtn.addEventListener('click', () => toggleCart(false));
    if (cartOverlay) cartOverlay.addEventListener('click', () => toggleCart(false));

    function updateCartUI() {
        if (!cartItemsContainer) return;
        
        let totalCount = 0;
        let subtotal = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<div class="cart-empty-message">Your bag is empty.</div>';
            if (checkoutBtn) checkoutBtn.disabled = true;
        } else {
            cartItemsContainer.innerHTML = '';
            if (checkoutBtn) checkoutBtn.disabled = false;

            cart.forEach(item => {
                totalCount += item.quantity;
                subtotal += item.price * item.quantity;

                const itemEl = document.createElement('div');
                itemEl.className = 'cart-item';
                itemEl.innerHTML = `
                    <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                    <div class="cart-item-details">
                        <h4 class="cart-item-title">${item.name}</h4>
                        <span class="cart-item-price">$${item.price.toFixed(2)}</span>
                        <div class="cart-item-qty">
                            <button class="cart-qty-btn decrease-qty" data-id="${item.id}">-</button>
                            <span class="cart-qty-val">${item.quantity}</span>
                            <button class="cart-qty-btn increase-qty" data-id="${item.id}">+</button>
                        </div>
                    </div>
                    <button class="cart-item-remove" data-id="${item.id}">Remove</button>
                `;
                cartItemsContainer.appendChild(itemEl);
            });
        }

        // Update totals & badges
        if (cartTotalBadge) cartTotalBadge.textContent = totalCount;
        if (cartTotalCountText) cartTotalCountText.textContent = totalCount;
        if (cartSubtotalText) cartSubtotalText.textContent = `$${subtotal.toFixed(2)}`;

        // Attach listeners for interactive elements inside drawer
        document.querySelectorAll('.increase-qty').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                changeQuantity(id, 1);
            });
        });

        document.querySelectorAll('.decrease-qty').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                changeQuantity(id, -1);
            });
        });

        document.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                removeFromCart(id);
            });
        });
    }

    function addToCart(id, name, price, image, qty = 1) {
        const existingItem = cart.find(item => item.id === id);
        if (existingItem) {
            existingItem.quantity += qty;
        } else {
            cart.push({ id, name, price: parseFloat(price), image, quantity: qty });
        }
        updateCartUI();
        const toastMsg = qty > 1 ? `${qty}x ${name} added to your bag.` : `${name} added to your bag.`;
        showToast(toastMsg);
        // Elegant micro-interaction: automatically slide cart drawer open
        setTimeout(() => {
            toggleCart(true);
        }, 500);
    }

    function changeQuantity(id, delta) {
        const item = cart.find(item => item.id === id);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                removeFromCart(id);
            } else {
                updateCartUI();
            }
        }
    }

    function removeFromCart(id) {
        const item = cart.find(item => item.id === id);
        const name = item ? item.name : 'Item';
        cart = cart.filter(item => item.id !== id);
        updateCartUI();
        showToast(`${name} removed from your bag.`);
    }

    // Attach listeners to "Add to Bag" buttons on product grid
    document.querySelectorAll('.product-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-product-id');
            const name = e.target.getAttribute('data-product-name');
            const price = e.target.getAttribute('data-product-price');
            const image = e.target.getAttribute('data-product-image');
            if (id && name && price) {
                addToCart(id, name, price, image);
            }
        });
    });

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            showToast("Directing to secure checkout...");
            setTimeout(() => {
                alert("Thank you for your purchase! This is a demo checkout simulation.");
                cart = [];
                updateCartUI();
                toggleCart(false);
            }, 1000);
        });
    }

    // ----------------------------------------------------------------
    // 8. Sticky Floating Purchase Card Logic
    // ----------------------------------------------------------------
    const stickyCard = document.getElementById('sticky-purchase-card');
    const stickySelect = document.getElementById('sticky-product-select');
    const stickyThumb = document.getElementById('sticky-card-thumb');
    const stickyQtyDec = document.getElementById('sticky-qty-dec');
    const stickyQtyInc = document.getElementById('sticky-qty-inc');
    const stickyQtyVal = document.getElementById('sticky-qty-val');
    const stickyAddBtn = document.getElementById('sticky-add-btn');
    const purchaseTypeRadios = document.querySelectorAll('input[name="sticky-purchase-type"]');
    const optionSubLabel = document.getElementById('option-sub-label');
    const optionOnceLabel = document.getElementById('option-once-label');

    let stickyQty = 1;

    // Toggle Sticky Card Visibility on Scroll
    function handleStickyCardScroll() {
        if (!stickyCard) return;
        // Show after scrolling past 500px
        if (window.scrollY > 500) {
            stickyCard.classList.add('active');
        } else {
            stickyCard.classList.remove('active');
        }
    }
    window.addEventListener('scroll', handleStickyCardScroll);
    handleStickyCardScroll();

    // Update Product Details when select dropdown changes
    function updateStickyCardProduct() {
        if (!stickySelect || !stickyThumb) return;
        const selectedOption = stickySelect.options[stickySelect.selectedIndex];
        if (!selectedOption) return;

        const image = selectedOption.getAttribute('data-image');
        stickyThumb.src = image;

        // Update pricing labels
        updateStickyPricing();
    }

    function updateStickyPricing() {
        if (!stickySelect) return;
        const selectedOption = stickySelect.options[stickySelect.selectedIndex];
        if (!selectedOption) return;

        const basePrice = parseFloat(selectedOption.getAttribute('data-price'));
        const subPrice = parseFloat(selectedOption.getAttribute('data-sub-price'));

        // Check subscription radio state
        let isSub = false;
        const checkedRadio = document.querySelector('input[name="sticky-purchase-type"]:checked');
        if (checkedRadio && checkedRadio.value === 'sub') {
            isSub = true;
        }

        const priceToUse = isSub ? subPrice : basePrice;

        // Update button text with dynamic price
        if (stickyAddBtn) {
            stickyAddBtn.textContent = `Add to Bag — $${(priceToUse * stickyQty).toFixed(2)}`;
        }
    }

    if (stickySelect) {
        stickySelect.addEventListener('change', updateStickyCardProduct);
    }

    // Subscribe vs One-time Radio Select handlers
    purchaseTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'sub') {
                if (optionSubLabel) optionSubLabel.classList.add('active');
                if (optionOnceLabel) optionOnceLabel.classList.remove('active');
            } else {
                if (optionSubLabel) optionSubLabel.classList.remove('active');
                if (optionOnceLabel) optionOnceLabel.classList.add('active');
            }
            updateStickyPricing();
        });
    });

    // Quantity controls
    if (stickyQtyDec) {
        stickyQtyDec.addEventListener('click', () => {
            if (stickyQty > 1) {
                stickyQty--;
                if (stickyQtyVal) stickyQtyVal.textContent = stickyQty;
                updateStickyPricing();
            }
        });
    }

    if (stickyQtyInc) {
        stickyQtyInc.addEventListener('click', () => {
            stickyQty++;
            if (stickyQtyVal) stickyQtyVal.textContent = stickyQty;
            updateStickyPricing();
        });
    }

    // Add to Bag handler
    if (stickyAddBtn && stickySelect) {
        stickyAddBtn.addEventListener('click', () => {
            const selectedOption = stickySelect.options[stickySelect.selectedIndex];
            if (!selectedOption) return;

            const name = selectedOption.getAttribute('data-name');
            const basePrice = parseFloat(selectedOption.getAttribute('data-price'));
            const subPrice = parseFloat(selectedOption.getAttribute('data-sub-price'));
            const image = selectedOption.getAttribute('data-image');
            const id = stickySelect.value;

            // Check subscription radio state
            let isSub = false;
            const checkedRadio = document.querySelector('input[name="sticky-purchase-type"]:checked');
            if (checkedRadio && checkedRadio.value === 'sub') {
                isSub = true;
            }

            const price = isSub ? subPrice : basePrice;
            const finalName = isSub ? `${name} (Subscription)` : name;

            addToCart(id, finalName, price, image, stickyQty);
        });
    }

    // ----------------------------------------------------------------
    // 9. Coffee vs Matcha Scroll Animations
    // ----------------------------------------------------------------
    const comparisonSection = document.getElementById('comparison');
    const compBarFills = document.querySelectorAll('.comp-bar-fill');

    if (comparisonSection && compBarFills.length > 0) {
        const comparisonObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    compBarFills.forEach(fill => {
                        const targetWidth = fill.getAttribute('data-value');
                        fill.style.width = targetWidth;
                    });
                    comparisonObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.2
        });
        comparisonObserver.observe(comparisonSection);
    }

    // ----------------------------------------------------------------
    // 10. Find Your Ritual Interactive Tabs
    // ----------------------------------------------------------------
    const ritualTabs = document.querySelectorAll('.ritual-tab-card');
    const showcaseCard = document.getElementById('showcase-card');
    const showcaseGlow = document.getElementById('showcase-glow');

    const showcaseImg = document.getElementById('showcase-img');
    const showcaseBadge = document.getElementById('showcase-badge');
    const showcaseTitle = document.getElementById('showcase-title');
    const showcaseBenefit = document.getElementById('showcase-benefit');
    const showcasePrice = document.getElementById('showcase-price');
    const showcaseBtn = document.getElementById('showcase-btn');

    const ritualData = {
        'morning-energy': {
            img: 'images/uji_ritual_tin.png',
            badge: 'Ceremonial Grade',
            title: 'Uji Ritual',
            benefit: 'Kickstart your day with high-concentration amino acids and chlorophyll for steady 6+ hour energy. Best served as traditional Usucha.',
            price: '$38.00',
            productId: 'uji-ritual',
            productName: 'Uji Ritual',
            productPrice: '38.00',
            btnText: 'Add Morning Energy to Bag'
        },
        'deep-focus': {
            img: 'images/daily_zen_tin.png',
            badge: 'Daily Ritual',
            title: 'Daily Zen',
            benefit: 'Unlock cognitive flow state. High L-theanine buffers caffeine release, promoting relaxed focus and clean mental clarity for study or work sessions.',
            price: '$26.00',
            productId: 'daily-zen',
            productName: 'Daily Zen',
            productPrice: '26.00',
            btnText: 'Add Deep Focus to Bag'
        },
        'calm-mind': {
            img: 'images/uji_ritual_tin.png',
            badge: 'Ceremonial Grade',
            title: 'Uji Ritual',
            benefit: 'Soothe mental fatigue. The premium stone-ground Uji leaves help downregulate stress hormones while improving meditation focus.',
            price: '$38.00',
            productId: 'uji-ritual',
            productName: 'Uji Ritual',
            productPrice: '38.00',
            btnText: 'Add Calm Mind to Bag'
        },
        'study-mode': {
            img: 'images/daily_zen_tin.png',
            badge: 'Daily Ritual',
            title: 'Daily Zen',
            benefit: 'Supercharge retention and memory recall. Clean, crash-free clean energy that powers you through demanding exams and research sprints.',
            price: '$26.00',
            productId: 'daily-zen',
            productName: 'Daily Zen',
            productPrice: '26.00',
            btnText: 'Add Study Mode to Bag'
        },
        'self-care': {
            img: 'images/chasen_whisk.png',
            badge: 'Aesthetic Accessory',
            title: 'Chasen Bamboo Whisk',
            benefit: 'Savor the art of the ceremony. Hand-crafted from 100-prong golden bamboo, whisking becomes a therapeutic screen-free self-care session.',
            price: '$22.00',
            productId: 'chasen-whisk',
            productName: 'Chasen Bamboo Whisk',
            productPrice: '22.00',
            btnText: 'Add Self Care to Bag'
        }
    };

    if (ritualTabs.length > 0 && showcaseCard) {
        ritualTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                if (tab.classList.contains('active')) return;

                const ritualType = tab.getAttribute('data-ritual');
                const data = ritualData[ritualType];
                if (!data) return;

                ritualTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                showcaseCard.classList.add('switching');
                
                if (showcaseGlow) {
                    if (ritualType === 'morning-energy' || ritualType === 'calm-mind') {
                        showcaseGlow.style.background = 'radial-gradient(circle, rgba(123, 241, 168, 0.2) 0%, transparent 70%)';
                    } else if (ritualType === 'deep-focus' || ritualType === 'study-mode') {
                        showcaseGlow.style.background = 'radial-gradient(circle, rgba(67, 128, 83, 0.25) 0%, transparent 70%)';
                    } else {
                        showcaseGlow.style.background = 'radial-gradient(circle, rgba(223, 178, 83, 0.15) 0%, transparent 70%)';
                    }
                }

                setTimeout(() => {
                    if (showcaseImg) showcaseImg.src = data.img;
                    if (showcaseBadge) showcaseBadge.textContent = data.badge;
                    if (showcaseTitle) showcaseTitle.textContent = data.title;
                    if (showcaseBenefit) showcaseBenefit.textContent = data.benefit;
                    if (showcasePrice) showcasePrice.textContent = data.price;

                    if (showcaseBtn) {
                        showcaseBtn.setAttribute('data-product-id', data.productId);
                        showcaseBtn.setAttribute('data-product-name', data.productName);
                        showcaseBtn.setAttribute('data-product-price', data.productPrice);
                        showcaseBtn.setAttribute('data-product-image', data.img);
                        showcaseBtn.textContent = data.btnText;
                    }

                    showcaseCard.classList.remove('switching');
                }, 300);
            });
        });
    }

    // Initial runs
    updateStickyCardProduct();
    updateStickyPricing();
    updateSimulator();
});
