
const config = {
  isMobile: window.innerWidth < 768,
  isTablet: window.innerWidth < 1024,
  prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  animationEnabled: true,
};

const eventListeners = [];
// Spotify Web Playback SDK state
let spotifyPlayer = null;
let spotifyDeviceId = null;
let spotifyConnected = false;

function scheduleIdleWork(callback) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, { timeout: 1500 });
    return;
  }

  window.setTimeout(callback, 0);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

function initializePortfolio() {
  if (config.prefersReducedMotion) {
    config.animationEnabled = false;
  }

  setupProjectFiltering();

  if (!config.animationEnabled) {
    return;
  }

  const startEnhancedExperience = () => {
    initializeAnimations();
    initializeScrollAnimations();
    initializeMouseGlow();
    initializeInteractions();
    initializeNowPlaying();
  };

  if (document.readyState === 'complete') {
    scheduleIdleWork(startEnhancedExperience);
  } else {
    window.addEventListener('load', () => scheduleIdleWork(startEnhancedExperience), { once: true });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePortfolio);
} else {
  initializePortfolio();
}

// ============================================================================
// GSAP SETUP & ANIMATIONS
// ============================================================================

/**
 * Initialize entrance animations (optimized)
 */
function initializeAnimations() {
  if (!config.animationEnabled) return;
  
  const heroText = document.querySelector('.accueil-text');
  if (heroText) {
    gsap.from(heroText, {
      opacity: 0,
      y: 30,
      duration: 1,
      ease: 'power3.out'
    });
  }
  
  const heroVisual = document.querySelector('.accueil-visual');
  if (heroVisual) {
    gsap.from(heroVisual, {
      opacity: 0,
      y: 40,
      duration: 1.2,
      delay: 0.2,
      ease: 'power3.out'
    });
  }
  
  const cards = document.querySelectorAll('.card, .work-card, .skill-card, .testimonial-card');
  if (cards.length > 0) {
    gsap.from(cards, {
      opacity: 0,
      y: 40,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: cards[0],
        start: 'top 80%',
        toggleActions: 'play none none none',
        once: true
      }
    });
  }
}

/**
 * Initialize scroll-triggered animations
 */
function initializeScrollAnimations() {
  // Parallax effect on decorative elements
  const decorations = document.querySelectorAll('.profile-decoration');
  decorations.forEach((decoration) => {
    gsap.to(decoration, {
      scrollTrigger: {
        trigger: decoration.closest('.profile-container'),
        scrub: 0.5,
        markers: false
      },
      y: 20,
      ease: 'none'
    });
  });

  // Now Playing parallax
  const nowPlayingBg = document.querySelector('.now-playing-bg');
  if (nowPlayingBg) {
    gsap.to(nowPlayingBg, {
      scrollTrigger: {
        trigger: '.now-playing',
        scrub: 1,
        markers: false
      },
      y: -50,
      ease: 'none'
    });
  }
}

/**
 * Initialize mouse glow effect with throttling
 */
function initializeMouseGlow() {
  if (config.isMobile || config.prefersReducedMotion) return;
  
  const heroSection = document.querySelector('.accueil');
  if (!heroSection) return;
  
  const glow = document.createElement('div');
  glow.className = 'mouse-glow';
  glow.style.cssText = `position:fixed;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle, rgba(91, 140, 255, 0.2) 0%, transparent 70%);pointer-events:none;z-index:1;display:none;filter:blur(60px);will-change:transform;`;
  heroSection.appendChild(glow);

  let mouseX = 0, mouseY = 0, glowX = 0, glowY = 0;
  let throttled = false;
  let inHero = false;

  const updateHeroVisibility = () => {
    inHero = window.scrollY < window.innerHeight;
  };

  updateHeroVisibility();
  window.addEventListener('scroll', updateHeroVisibility, { passive: true });
  window.addEventListener('resize', updateHeroVisibility, { passive: true });

  const handleMouseMove = (e) => {
    if (throttled) return;
    throttled = true;
    
    mouseX = e.clientX;
    mouseY = e.clientY;

    requestAnimationFrame(() => {
      if (inHero) {
        glow.style.display = 'block';
        glowX += (mouseX - glowX) * 0.15;
        glowY += (mouseY - glowY) * 0.15;
        glow.style.left = (glowX - 250) + 'px';
        glow.style.top = (glowY - 250) + 'px';
      } else {
        glow.style.display = 'none';
      }
      throttled = false;
    });
  };

  document.addEventListener('mousemove', handleMouseMove, { passive: true });
  eventListeners.push({ type: 'mousemove', handler: handleMouseMove });
}

/**
 * Initialize interactive effects (optimized with delegation)
 */
function initializeInteractions() {
  if (!config.animationEnabled) return;

  const handleHover = (e) => {
    const isEnter = e.type === 'mouseenter';
    
    // Button hover
    const button = e.target.closest('.accueil-link, .btn, .btn-primary, .btn-ghost');
    if (button) {
      gsap.to(button, {
        scale: isEnter ? 1.05 : 1,
        duration: 0.3,
        ease: 'back.out',
        overwrite: 'auto'
      });
      return;
    }

    // Card hover
    const card = e.target.closest('.card, .work-card, .skill-card, .testimonial-card, .focus-card, .target-card');
    if (card) {
      gsap.to(card, {
        y: isEnter ? -8 : 0,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    }
  };

  document.addEventListener('mouseenter', handleHover, true);
  document.addEventListener('mouseleave', handleHover, true);
}

// ============================================================================
// NOW PLAYING SECTION
// ============================================================================

/**
 * Initialize Now Playing section with animations (optimized)
 */
function initializeNowPlaying() {
  if (!config.animationEnabled) return;

  const albumCover = document.querySelector('.album-cover');
  const visualizer = document.querySelector('.visualizer');
  
  if (!albumCover || !visualizer) return;

  // Album cover floating animation
  gsap.to(albumCover, {
    y: 8,
    duration: 3,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
    paused: config.isMobile
  });

  // Visualizer bars animation (reduced on mobile)
  const bars = document.querySelectorAll('.bar');
  if (bars.length > 0) {
    const updateInterval = config.isMobile ? 0.5 : 0.3;
    bars.forEach((bar, index) => {
      gsap.to(bar, {
        height: () => Math.random() * 60 + 20,
        duration: updateInterval,
        repeat: -1,
        delay: index * 0.05,
        ease: 'power1.inOut'
      });
    });

    gsap.to(visualizer, {
      boxShadow: '0 0 30px rgba(91, 140, 255, 0.5), inset 0 0 20px rgba(91, 140, 255, 0.1)',
      duration: 1,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }

  const playBtn = document.querySelector('.play-btn');
  if (playBtn) {
    playBtn.addEventListener('mouseenter', function() {
      gsap.to(this, { scale: 1.1, duration: 0.3, ease: 'back.out' });
    });

    playBtn.addEventListener('mouseleave', function() {
      gsap.to(this, { scale: 1, duration: 0.3, ease: 'back.out' });
    });

    playBtn.addEventListener('click', function() {
      gsap.to(this, { rotation: 360, duration: 0.6, ease: 'power2.out' });
    });

    // Set default Now Playing to "Instant Crush" by Daft Punk
    const trackInfo = {
      title: 'Instant Crush',
      artist: 'Daft Punk',
      spotifySearch: 'https://open.spotify.com/search/Instant%20Crush%20Daft%20Punk'
    };

    const trackTitleEl = document.querySelector('.track-title');
    const artistEl = document.querySelector('.artist-name');
    if (trackTitleEl) trackTitleEl.textContent = trackInfo.title;
    if (artistEl) artistEl.textContent = trackInfo.artist;

    // Expose basic Media Session metadata so OS shows current track (no artwork to avoid hotlinking)
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: trackInfo.title,
          artist: trackInfo.artist,
          album: 'Random Access Memories'
        });

        navigator.mediaSession.setActionHandler('play', () => { window.open(trackInfo.spotifySearch, '_blank'); });
        navigator.mediaSession.setActionHandler('pause', () => {});
      } catch (e) {
        // ignore Media Session errors
      }
    }

    // Clicking the play button will either focus the Spotify embed or control the local audio
    playBtn.addEventListener('click', function openEmbeddedPlayer() {
      const selected = document.querySelector('input[name="music-source"]:checked');
      const source = selected ? selected.value : 'spotify';
      if (source === 'spotify') {
        // If Spotify SDK connected, play via Web API on user's device
        if (spotifyConnected && spotifyDeviceId) {
          playSpotifyTrack('spotify:track:2cGxRwrMyEAp8dEbuZaVv6');
          return;
        }

        const iframe = document.querySelector('.spotify-embed');
        const help = document.querySelector('.player-help');
        if (iframe) {
          iframe.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        if (help) {
          help.style.display = 'block';
          setTimeout(() => { help.style.display = 'none'; }, 5000);
        }
      }
    });

    // --- Local audio source handling (file input + audio element + analyzer) ---
    const sourceRadios = document.querySelectorAll('input[name="music-source"]');
    const localUploader = document.querySelector('.local-uploader');
    const audioFileInput = document.getElementById('audio-file');
    const localAudio = document.getElementById('local-audio');

    let audioContext = null;
    let analyser = null;
    let sourceNode = null;
    let dataArray = null;
    let rafId = null;
    let analyzerActive = false;

    const stopAnalyzer = () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (sourceNode) try { sourceNode.disconnect(); } catch(e){}
      if (analyser) try { analyser.disconnect(); } catch(e){}
      analyzerActive = false;
      // restart GSAP visualizer random tweens
      if (bars && bars.length) {
        gsap.killTweensOf(bars);
        const updateInterval = config.isMobile ? 0.5 : 0.3;
        bars.forEach((bar, index) => {
          gsap.to(bar, {
            height: () => Math.random() * 60 + 20,
            duration: updateInterval,
            repeat: -1,
            delay: index * 0.05,
            ease: 'power1.inOut'
          });
        });
      }
    };

    const startAnalyzer = () => {
      if (!localAudio) return;
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      try {
        sourceNode = audioContext.createMediaElementSource(localAudio);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        sourceNode.connect(analyser);
        analyser.connect(audioContext.destination);
      } catch (e) {
        console.warn('AudioContext error', e);
        return;
      }

      analyzerActive = true;

      const animate = () => {
        if (!analyser) return;
        analyser.getByteFrequencyData(dataArray);
        bars.forEach((bar, i) => {
          const v = dataArray[i % dataArray.length] || 0;
          const h = Math.max(8, (v / 255) * 120);
          bar.style.height = h + 'px';
        });
        rafId = requestAnimationFrame(animate);
      };

      // stop GSAP tweens before using analyzer
      if (bars && bars.length) gsap.killTweensOf(bars);
      animate();
    };

    // show/hide uploader based on radio
    sourceRadios.forEach((radio) => {
      radio.addEventListener('change', () => {
        if (radio.value === 'local' && radio.checked) {
          localUploader.style.display = 'block';
          if (localAudio && !localAudio.paused) {
            // if switching to local while playing external, pause external behaviour
          }
        } else if (radio.value === 'spotify' && radio.checked) {
          localUploader.style.display = 'none';
          // pause local audio if playing
          if (localAudio && !localAudio.paused) {
            localAudio.pause();
            stopAnalyzer();
          }
        }
      });
    });

    // file chosen -> load into audio element
    if (audioFileInput && localAudio) {
      audioFileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        localAudio.src = url;
        localAudio.style.display = 'block';
        // update UI with filename
        if (trackTitleEl) trackTitleEl.textContent = file.name.replace(/\.[^/.]+$/, '');
        if (artistEl) artistEl.textContent = 'Fichier local';
      });
    }

    // playBtn controls local audio when source=local
    if (playBtn && localAudio) {
      playBtn.addEventListener('click', (e) => {
        const selected = document.querySelector('input[name="music-source"]:checked');
        const source = selected ? selected.value : 'spotify';
        if (source !== 'local') return;
        if (!localAudio.src) {
          // prompt file chooser
          audioFileInput && audioFileInput.click();
          return;
        }
        // toggle play/pause
        if (localAudio.paused) {
          localAudio.play().then(() => {
            // start analyzer
            startAnalyzer();
            // update play icon
            const icon = playBtn.querySelector('i');
            if (icon) icon.className = 'ri-pause-fill';
          }).catch(() => {});
        } else {
          localAudio.pause();
          stopAnalyzer();
          const icon = playBtn.querySelector('i');
          if (icon) icon.className = 'ri-play-fill';
        }
      });

      // sync icon when audio is paused/played directly via controls
      localAudio.addEventListener('play', () => {
        const icon = playBtn.querySelector('i'); if (icon) icon.className = 'ri-pause-fill';
        // resume audio context if suspended
        if (audioContext && audioContext.state === 'suspended') audioContext.resume();
        startAnalyzer();
      });

      localAudio.addEventListener('pause', () => {
        const icon = playBtn.querySelector('i'); if (icon) icon.className = 'ri-play-fill';
        stopAnalyzer();
      });
    }
  }
}

// ============================================================================
// DYNAMIC CONTENT LOADING
// ============================================================================

/**
 * Handle project filtering for switching between dev and creative projects
 */
function setupProjectFiltering() {
  const switchButtons = document.querySelectorAll('.switch-btn');
  const projectPanels = document.querySelectorAll('.projects-panel');

  if (!switchButtons.length || !projectPanels.length) {
    return;
  }

  const applyFilter = (target) => {
    switchButtons.forEach((button) => {
      const isActive = button.dataset.target === target;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    projectPanels.forEach((panel) => {
      const isActive = panel.id === `projects-${target}-panel`;
      panel.classList.toggle('is-active', isActive);
      panel.hidden = !isActive;
      panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });
  };

  const initialButton = document.querySelector('.switch-btn.is-active') || switchButtons[0];
  const initialTarget = initialButton ? initialButton.dataset.target : 'dev';

  applyFilter(initialTarget);

  switchButtons.forEach((button) => {
    if (button.dataset.projectFilteringBound === 'true') {
      return;
    }

    button.dataset.projectFilteringBound = 'true';

    button.addEventListener('click', function() {
      const target = this.dataset.target;

      if (!target) {
        return;
      }

      applyFilter(target);
    });
  });
}

// ============================================================================
// SCROLL TO SECTION HELPER
// ============================================================================

/**
 * Smooth scroll to section
 */
function scrollToSection(selector) {
  const element = document.querySelector(selector);
  if (!element) return;

  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Debounce function for performance optimization
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Check if element is in viewport
 */
function isElementInViewport(el) {
  const rect = el.getBoundingClientRect();
  return (
    rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.bottom >= 0
  );
}

// ============================================================================
// RESPONSIVE ADJUSTMENTS
// ============================================================================

// ============================================================================
// CLEANUP & PERFORMANCE
// ============================================================================

window.addEventListener('beforeunload', () => {
  eventListeners.forEach(({ handler }) => {
    document.removeEventListener('mousemove', handler, { passive: true });
  });
});

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

if (window.location.hostname === 'localhost') {
  console.log('✓ Portfolio optimized', { 
    isMobile: config.isMobile, 
    animationEnabled: config.animationEnabled,
    prefersReducedMotion: config.prefersReducedMotion
  });
}

// -------------------------------
// Spotify Web Playback SDK helpers
// -------------------------------

function pollTokenAndInit(retries = 20, interval = 1000) {
  const attempt = async (n) => {
    try {
      const res = await fetch('/spotify/token');
      if (!res.ok) throw new Error('no-token');
      const json = await res.json();
      // token available -> init SDK
      initSpotifyPlayer();
      return;
    } catch (e) {
      if (n <= 0) return;
      setTimeout(() => attempt(n - 1), interval);
    }
  };
  attempt(retries);
}

function loadSpotifySDK() {
  return new Promise((resolve) => {
    if (window.Spotify) return resolve(window.Spotify);
    const s = document.createElement('script');
    s.src = 'https://sdk.scdn.co/spotify-player.js';
    s.async = true;
    s.onload = () => resolve(window.Spotify);
    document.head.appendChild(s);
  });
}

async function initSpotifyPlayer() {
  try {
    const sp = await loadSpotifySDK();
    // get a token once and then let player request refreshed tokens via our endpoint
    const tokenRes = await fetch('/spotify/token');
    if (!tokenRes.ok) {
      console.warn('Spotify token not available');
      return;
    }
    const tokenJson = await tokenRes.json();

    if (spotifyPlayer) return;

    spotifyPlayer = new window.Spotify.Player({
      name: 'Portfolio Player',
      getOAuthToken: cb => {
        fetch('/spotify/token').then(r => r.json()).then(j => cb(j.access_token)).catch(() => cb(tokenJson.access_token));
      }
    });

    // error handling
    spotifyPlayer.addListener('initialization_error', ({ message }) => { console.error(message); });
    spotifyPlayer.addListener('authentication_error', ({ message }) => { console.error('auth error', message); });
    spotifyPlayer.addListener('account_error', ({ message }) => { console.error('account error', message); });
    spotifyPlayer.addListener('playback_error', ({ message }) => { console.error('playback error', message); });

    // ready
    spotifyPlayer.addListener('ready', ({ device_id }) => {
      spotifyDeviceId = device_id;
      spotifyConnected = true;
      console.log('Spotify Player ready, device id', device_id);
      // transfer playback to this device (no auto play)
      fetch(`https://api.spotify.com/v1/me/player`, {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + tokenJson.access_token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_ids: [device_id], play: false })
      }).catch(() => {});
    });

    spotifyPlayer.addListener('not_ready', ({ device_id }) => {
      console.log('Spotify Player not ready', device_id);
      spotifyConnected = false;
    });

    spotifyPlayer.connect();
  } catch (e) {
    console.error('Failed to init Spotify player', e);
  }
}

async function playSpotifyTrack(uri) {
  try {
    // ensure token
    const tokenRes = await fetch('/spotify/token');
    if (!tokenRes.ok) {
      // try to prompt login
      window.open('/spotify/login', '_blank', 'width=600,height=800');
      pollTokenAndInit();
      return;
    }
    const { access_token } = await tokenRes.json();
    if (!spotifyDeviceId) {
      // try to init
      await initSpotifyPlayer();
    }
    const playEndpoint = `https://api.spotify.com/v1/me/player/play?device_id=${spotifyDeviceId}`;
    await fetch(playEndpoint, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + access_token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ uris: [uri] })
    });
  } catch (e) {
    console.error('playSpotifyTrack error', e);
  }
}

// Connect button handling
document.addEventListener('DOMContentLoaded', () => {
  const connectBtn = document.getElementById('connect-spotify-btn');
  if (connectBtn) {
    connectBtn.addEventListener('click', () => {
      // open Spotify auth flow in a popup
      window.open('/spotify/login', '_blank', 'width=600,height=800');
      // poll server for token and initialize SDK
      pollTokenAndInit(30, 1500);
    });
  }
});
