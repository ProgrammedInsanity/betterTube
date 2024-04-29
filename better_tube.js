// ==UserScript==
// @name         BetterTube
// @match        http://*.youtube.com/*
// @match        http://youtube.com/*
// @match        https://*.youtube.com/*
// @match        https://youtube.com/*
// @require      https://pastebin.com/raw/cWHic8Gu
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

const style = `
.BT-WATCHED-HIDDEN { display: none !important }

.BT-TOO-SHORT-HIDDEN { display: none !important }

.BT-NOT-ENOUGH-VIEWS-HIDDEN { display: none !important }

.BT-KEYWORD-HIDDEN { display: none !important }

.BT-WATCHED-DIMMED { opacity: 0.3 }

.BT-SHORTS-HIDDEN { display: none !important }

.BT-SHORTS-DIMMED { opacity: 0.3 }

.BT-HIDDEN-ROW-PARENT { padding-bottom: 10px }

.BT-BUTTONS {
	background: transparent;
    display: flex;
    gap: 5px;
	margin: 0 20px;
}

.BT-BUTTON {
	align-items: center;
	background: transparent;
	border: 0;
    border-radius: 40px;
	color: var(--yt-spec-icon-inactive);
	cursor: pointer;
    display: flex;
	height: 40px;
    justify-content: center;
	outline: 0;
	width: 40px;
}

.BT-BUTTON:focus,
.BT-BUTTON:hover {
	background: var(--yt-spec-badge-chip-background);
}

.BT-BUTTON-DISABLED { color: var(--yt-spec-icon-disabled) }

.BT-MENU {
	background: #F8F8F8;
	border: 1px solid #D3D3D3;
	box-shadow: 0 1px 0 rgba(0, 0, 0, 0.05);
	display: none;
	font-size: 12px;
	margin-top: -1px;
	padding: 10px;
	position: absolute;
	right: 0;
	text-align: center;
	top: 100%;
	white-space: normal;
	z-index: 9999;
}

.BT-MENU-ON { display: block; }
.BT-MENUBUTTON-ON span { transform: rotate(180deg) }
`;
GMC_ID = 'betterTubeSettings';
const DEBUG = false;

const IS_MOBILE = window.innerWidth < 1024;
const BUTTON_AREA_DESKTOP_QUERY = '#container #end #buttons';
const BUTTON_AREA_MOBILE_QUERY = 'div.mobile-topbar-header-content.non-search-mode.cbox';
const BUTTON_AREA_QUERY = IS_MOBILE ? BUTTON_AREA_MOBILE_QUERY : BUTTON_AREA_DESKTOP_QUERY;

const HOMPAGE_VIDEO_CONTAINER_QUERY_DESKTOP = 'div#dismissible.style-scope.ytd-rich-grid-media';
const WATCH_PAGE_VIDEO_CONTAINER_QUERY_DESKTOP = 'div#dismissible.style-scope.ytd-compact-video-renderer';

const HOMPAGE_VIDEO_CONTAINER_QUERY_MOBILE = 'ytm-rich-item-renderer.fresh-feeds-dismissals.rich-item-single-column';
const WATCH_PAGE_VIDEO_CONTAINER_QUERY_MOBILE = 'ytm-video-with-context-renderer.item.adaptive-feed-item';

const HOMEPAGE_VIDEO_CONTAINER_QUERY = IS_MOBILE ? HOMPAGE_VIDEO_CONTAINER_QUERY_MOBILE : HOMPAGE_VIDEO_CONTAINER_QUERY_DESKTOP;
const WATCH_PAGE_VIDEO_CONTAINER_QUERY = IS_MOBILE ? WATCH_PAGE_VIDEO_CONTAINER_QUERY_MOBILE : WATCH_PAGE_VIDEO_CONTAINER_QUERY_DESKTOP;


const VIDEO_LINK_QUERY = 'a[href^="/watch?v="]';

const VIDEO_TITLE_QUERY_DESKTOP = '#video-title';
const VIDEO_TITLE_QUERY_MOBILE = 'span.yt-core-attributed-string';
const VIDEO_TITLE_QUERY = IS_MOBILE ? VIDEO_TITLE_QUERY_MOBILE : VIDEO_TITLE_QUERY_DESKTOP;

const TIME_LENGTH_QUERY_DESKTOP = '#time-status';
const TIME_LENGTH_QUERY_MOBILE = 'div.badge-shape-wiz__text';
const TIME_LENGTH_QUERY = IS_MOBILE ? TIME_LENGTH_QUERY_MOBILE : TIME_LENGTH_QUERY_DESKTOP;

const VIEWS_QUERY_DESKTOP = '.inline-metadata-item';
const VIEWS_QUERY_MOBILE = '[aria-label$=" views"]';
const VIEWS_QUERY = IS_MOBILE ? VIEWS_QUERY_MOBILE : VIEWS_QUERY_DESKTOP

const CHANNEL_NAME_QUERY_WATCH_DESKTOP = 'div:nth-child(1) > ytd-channel-name:nth-child(1) > div:nth-child(1) > div:nth-child(1) > yt-formatted-string';
const CHANNEL_NAME_QUERY_WATCH_MOBILE = 'ytm-badge-and-byline-renderer:nth-child(1) > span:nth-child(1) > span';
const CHANNEL_NAME_QUERY_WATCH = IS_MOBILE ? CHANNEL_NAME_QUERY_WATCH_MOBILE : CHANNEL_NAME_QUERY_WATCH_DESKTOP;

const CHANNEL_NAME_QUERY_HOMEPAGE_DESKTOP = 'div:nth-child(1) > ytd-channel-name:nth-child(1) > div:nth-child(1) > div:nth-child(1) > yt-formatted-string > a';
const CHANNEL_NAME_QUERY_HOMEPAGE_MOBILE = 'ytm-badge-and-byline-renderer:nth-child(1) > span:nth-child(1) > span';
const CHANNEL_NAME_QUERY_HOMEPAGE = IS_MOBILE ? CHANNEL_NAME_QUERY_HOMEPAGE_MOBILE : CHANNEL_NAME_QUERY_HOMEPAGE_DESKTOP;

const PROGRESS_QUERY_DESKTOP = '#progress';
const PROGRESS_QUERY_MOBILE = 'div.thumbnail-overlay-resume-playback-progress';
const PROGRESS_QUERY = IS_MOBILE ? PROGRESS_QUERY_MOBILE : PROGRESS_QUERY_DESKTOP;


//debug print functions
const debug = (...msgs) => {
    // eslint-disable-next-line no-console
    if (DEBUG) console.log('[BT]', msgs);
};
// GreaseMonkey no longer supports GM_addStyle. So we have to define
// our own polyfill here
const addStyle = function (aCss) {
    const head = document.getElementsByTagName('head')[0];
    if (head) {
        const style = document.createElement('style');
        style.setAttribute('type', 'text/css');
        style.textContent = aCss;
        head.appendChild(style);
        return style;
    }
    return null;
};

const debounce = function (func, wait, immediate) {
    let timeout;
    return (...args) => {
        const later = () => {
            timeout = null;
            if (!immediate) func.apply(this, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(this, args);
    };
};
function findButtonAreaTarget() {
    // Button will be injected into the main header menu
    return document.querySelector(BUTTON_AREA_QUERY);
};


function checkSubstring(str, substr) {
    return str.includes(substr) && str.lastIndexOf(substr) + substr.length === str.length;
}
/**
 * Determines the current section of YouTube based on the URL.
 * @returns {string} The current YouTube section. Possible values are:
 * - 'watch' for video watch page
 * - 'channel' for channel pages
 * - 'subscriptions' for subscription feed
 * - 'trending' for trending feed
 * - 'playlist' for playlist pages
 * - 'search' for search results pages
 * - 'homepage' for YouTube homepage
 * - 'misc' for other sections
 */
const determineYoutubeSection = function () {
    const { href } = window.location;
    let youtubeSection = 'misc';
    if (href.includes('/watch?')) {
        youtubeSection = 'watch';
    } else if (href.match(/.*\/(user|channel|c)\/.+\/videos/u) || href.match(/.*\/@.*/u)) {
        youtubeSection = 'channel';
    } else if (href.includes('/feed/subscriptions')) {
        youtubeSection = 'subscriptions';
    } else if (href.includes('/feed/trending')) {
        youtubeSection = 'trending';
    } else if (href.includes('/playlist?')) {
        youtubeSection = 'playlist';
    } else if (href.includes('/results?')) {
        youtubeSection = 'search';
    }

    if (checkSubstring(href, 'youtube.com/')) {
        youtubeSection = 'homepage';
    }

    return youtubeSection;
};



const observeDOM = (function () {
    const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    const eventListenerSupported = window.addEventListener;

    return function (obj, callback) {
        debug('Attaching DOM listener');

        // Invalid `obj` given
        if (!obj) return;

        if (MutationObserver) {
            const obs = new MutationObserver(((mutations, _observer) => {
                if (mutations[0].addedNodes.length || mutations[0].removedNodes.length) {

                    callback(mutations);
                }
            }));

            obs.observe(obj, { childList: true, subtree: true });
        } else if (eventListenerSupported) {
            obj.addEventListener('DOMNodeInserted', callback, false);
            obj.addEventListener('DOMNodeRemoved', callback, false);
        }
    };
}());



/**
 * Fetches the description of a YouTube video using the YouTube Data API.
 * If the description is found in the local storage cache, it is returned from there.
 * Otherwise, it makes a network request to fetch the description from the API.
 * The fetched description is then stored in the local storage cache for future use.
 *
 * @param {string} videoId - The ID of the YouTube video.
 * @returns {string|null} - The description of the video, or null if it couldn't be fetched.
 */
function fetchVideoDescription(videoId) {
    // first check local storage cache
    const cacheKey = `videoDescription_${videoId}`;
    const cachedDescription = localStorage.getItem(cacheKey);
    if (cachedDescription) {
        debug('fetchVideoDescription: Found cached description');
        return cachedDescription;
    }

    const GMCConfigjson = localStorage.getItem(GMC_ID);
    if (!GMCConfigjson) {
        debug('fetchVideoDescription: No GMCConfig found');
        return null;
    }
    const GMCConfig = JSON.parse(GMCConfigjson);
    const apiKey = GMCConfig.BT_YT_API_KEY;
    if (!apiKey) {
        debug('fetchVideoDescription: No API key found');
        return null;
    }

    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.items.length > 0) {
                const description = data.items[0].snippet.description;
                localStorage.setItem(cacheKey, description);
                return description;
            } else {
                console.log('No video found.');
            }
        })
        .catch(error => {
            console.error('Error fetching video data:', error);
            return null;
        });
}


function convertYtTimeToSeconds(input) {
    const components = input.split(':');
    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    // convert hour:minute:seconds text to int variables
    if (components.length === 3) {
        hours = parseInt(components[0]);
        minutes = parseInt(components[1]);
        seconds = parseInt(components[2]);
    } else if (components.length === 2) {
        minutes = parseInt(components[0]);
        seconds = parseInt(components[1]);
    } else if (components.length === 1) {
        seconds = parseInt(components[0]);
    }

    // Set NaN values to 0
    hours = isNaN(hours) ? 0 : hours;
    minutes = isNaN(minutes) ? 0 : minutes;
    seconds = isNaN(seconds) ? 0 : seconds;

    // Calculate the total seconds
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;

    return totalSeconds;
}

function convertViewsToNumber(input) {
    const units = {
        'K': 1000,
        'M': 1000000,
        'B': 1000000000,
        'T': 1000000000000
    };

    const regex = /(\d+\.?\d*)(K|M|B|T)?/i;
    const match = regex.exec(input);

    if (match) {
        const number = parseFloat(match[1]);
        const unit = match[2] ? match[2].toUpperCase() : '';

        return number * (units[unit] || 1);
    }

    return NaN;
}

/**
 * Retrieves video data from YouTube homepage and video watch page.
 * @returns {Array} An array of video objects containing videoContainer,videoId, title, channelName, progress, timeLength, channelHandle, views and hiddenOrDimmed.
 */
function getYoutubeVideoData() {
    var videoData = [];

    // youtube video container on the homepage
    // div( id="dismissible",  class="style-scope ytd-rich-grid-media" )
    var videoContainers = document.querySelectorAll(HOMEPAGE_VIDEO_CONTAINER_QUERY);
    //when watching a video
    var videoContainersCompact = document.querySelectorAll(WATCH_PAGE_VIDEO_CONTAINER_QUERY);

    videoContainers = Array.from(videoContainers).concat(Array.from(videoContainersCompact));


    videoContainers.forEach(function (videoContainer) {
        const videoInfo = {};
        videoInfo.videoContainer = videoContainer;

        videoInfo.hiddenOrDimmed = videoContainer.classList.contains('BT-WATCHED-HIDDEN') 
        || videoContainer.classList.contains('BT-TOO-SHORT-HIDDEN') 
        || videoContainer.classList.contains('BT-NOT-ENOUGH-VIEWS-HIDDEN') 
        || videoContainer.classList.contains('BT-KEYWORD-HIDDEN') 
        || videoContainer.classList.contains('BT-WATCHED-DIMMED');
        
        // Extract videoId from the href attribute of the link
        const videoLinkElement = videoContainer.querySelector(VIDEO_LINK_QUERY);
        videoInfo.videoId = videoLinkElement ? videoLinkElement.href.split('=')[1] : "";
        if (videoInfo.videoId.includes("@list")) {
            debug('Skipping playlist video');
            return;
        }

        const videoTitleElement = videoContainer.querySelector(VIDEO_TITLE_QUERY);
        videoInfo.title = videoTitleElement ? videoTitleElement.textContent.trim() : "";

        const progressElement = videoContainer.querySelector(PROGRESS_QUERY);
        videoInfo.progress = progressElement ? parseInt(progressElement.style.width, 10) : 0;

        const timeStatusElement = videoContainer.querySelector(TIME_LENGTH_QUERY);
        videoInfo.timeLength = timeStatusElement ? convertYtTimeToSeconds(timeStatusElement.textContent) : 0;


        // Extract views from the text content of the views element
        const viewsElement = videoContainer.querySelector(VIEWS_QUERY);
        // go from "2.1M views" to "2.1M" to 2100000 
        videoInfo.views = viewsElement ? convertViewsToNumber(viewsElement.textContent.split(" ")[0]) : 0;

        

        // channel name
        var channelNameElement;
        if (determineYoutubeSection() === 'watch') {
            channelNameElement = videoContainer.querySelector(CHANNEL_NAME_QUERY_WATCH);
            videoInfo.channelName = channelNameElement ? channelNameElement.textContent : "";
        } else {
            channelNameElement = videoContainer.querySelector(CHANNEL_NAME_QUERY_HOMEPAGE);
            videoInfo.channelName = channelNameElement ? channelNameElement.textContent : "";
        }

        // check if data is incomplete
        if (videoInfo.videoId === null 
            || videoInfo.title === null
            || videoInfo.channelName === null
            || videoInfo.progress === null
            || videoInfo.timeLength === null
            || videoInfo.views === null) {
            debug('Incomplete video data(DATA):', videoInfo);
        }

        // check if data element are null
        if (videoLinkElement === null 
            || videoTitleElement === null 
            || timeStatusElement === null 
            || viewsElement === null 
            || channelNameElement === null) { 
            debug('Incomplete video data(ELEMENT):', videoInfo);

            debug('[Incomplete] videoLinkElement:', videoLinkElement);
            debug('[Incomplete] videoTitleElement:', videoTitleElement);
            debug('[Incomplete] timeStatusElement:', timeStatusElement);
            debug('[Incomplete] viewsElement:', viewsElement);
            debug('[Incomplete] channelNameElement:', channelNameElement);
            }
        


        videoData.push(videoInfo);
    });
    

    return videoData;
}

function hideVideoIfKeywordMatch(keywords, stringToCheck, debugMessage) {
    if (keywords.some(keyword => stringToCheck.includes(keyword))) {
        videoInfo.videoContainer.classList.add('BT-KEYWORD-HIDDEN');
        debug(debugMessage);
        return true;
    }
    return false;
}

function processRules() {
    const youtubeSection = determineYoutubeSection();
    if (youtubeSection !== 'homepage' && youtubeSection !== 'watch') {
        debug('Not on YouTube homepage or video watch page, skipping BetterTube rules');
        return;
    }

    const temp_GMCConfig = localStorage.getItem(GMC_ID);
    if (!temp_GMCConfig) {
        return null;
    }

    const GMCConfig = JSON.parse(temp_GMCConfig);

    const hideShorts = GMCConfig.BT_HIDE_SHORTS ? GMCConfig.BT_HIDE_SHORTS : false;
    const dimWatched = GMCConfig.BT_DIM_WATCHED ? GMCConfig.BT_DIM_WATCHED : false;
    const hideWatched = GMCConfig.BT_HIDE_WATCHED ? GMCConfig.BT_HIDE_WATCHED : false;
    const hideChannelsKeywords = GMCConfig.BT_HIDE_CHANNELS_KEYWORDS ? GMCConfig.BT_HIDE_CHANNELS_KEYWORDS.split(",") : [];
    const hideTitleVideosKeywords = GMCConfig.BT_HIDE_VIDEOS_TITLE_KEYWORDS ? GMCConfig.BT_HIDE_VIDEOS_TITLE_KEYWORDS.split(",") : [];
    const hiddenThresholdViews = GMCConfig.BT_HIDE_THRESHOLD_VIEWS ? GMCConfig.BT_HIDE_THRESHOLD_VIEWS : 0;
    const hideVideosKeywordsDesc = GMCConfig.BT_HIDE_VIDEOS_KEYWORDS_DESC ? GMCConfig.BT_HIDE_VIDEOS_KEYWORDS_DESC.split(",") : [];
    const hideThresholdLength = GMCConfig.BT_HIDE_THRESHOLD_LENGTH ? GMCConfig.BT_HIDE_THRESHOLD_LENGTH : 0;

    // Get video data
    const videoData = getYoutubeVideoData();

    videoData.forEach(function (videoInfo) {
        if (videoInfo.hiddenOrDimmed) {
            videoInfo.videoContainer.classList.remove('BT-WATCHED-DIMMED');
            videoInfo.videoContainer.classList.remove('BT-WATCHED-HIDDEN');
            videoInfo.videoContainer.classList.remove('BT-TOO-SHORT-HIDDEN');
            videoInfo.videoContainer.classList.remove('BT-NOT-ENOUGH-VIEWS-HIDDEN');
            videoInfo.videoContainer.classList.remove('BT-KEYWORD-HIDDEN');
        }
        

        if (videoInfo.timeLength < hideThresholdLength) {
            videoInfo.videoContainer.classList.add('BT-TOO-SHORT-HIDDEN');
            debug('Hiding video with less than threshold length. time length', videoInfo.timeLength);
            return;
        }

        if (videoInfo.views < hiddenThresholdViews) {
            videoInfo.videoContainer.classList.add('BT-NOT-ENOUGH-VIEWS-HIDDEN');
            debug('Hiding video with less than threshold views. views:', videoInfo.views);
            return;
        }

        if (hideWatched && videoInfo.progress > 5) {
            videoInfo.videoContainer.classList.add('BT-WATCHED-HIDDEN');
            debug('Hiding watched video');
            return;
        }

        if (dimWatched && videoInfo.progress > 5) {
            videoInfo.videoContainer.classList.add('BT-WATCHED-DIMMED');
            debug('Dimming watched video');
            return;
        }

        if (hideVideoIfKeywordMatch(hideChannelsKeywords, videoInfo.channelName, 'Hiding video with keyword in channel name')) return;
        if (hideVideoIfKeywordMatch(hideTitleVideosKeywords, videoInfo.title, 'Hiding video with keyword in title')) return;
        
        if (hideVideosKeywordsDesc.length > 0) {
            try {
                const videoDescription = fetchVideoDescription(videoInfo.videoId);
                if (videoDescription && hideVideoIfKeywordMatch(hideVideosKeywordsDesc, videoDescription, 'Hiding video with keyword in description')) return;
            } catch (error) {
                console.error('Failed to fetch video description:', error);
            }
        }
    });
}

// Your function code goes here
function init() {
    // Enable for debugging
    debug("started");

    // GM_config setup
    const title = document.createElement('a');
    title.textContent = 'Make youtube better';
    title.target = '_blank';
    const gmc = new GM_config({
        events: {
            save() {
                this.close();
                processRules();
            },
        },
        fields: {
            // Hide shorts button
            BT_HIDE_SHORTS: {
                default: false,
                label: 'Hide Shorts',
                type: 'checkbox',
            },
            // Dim watched videos
            BT_DIM_WATCHED: {
                default: false,
                label: 'Dim watched videos',
                type: 'checkbox',
            },
            // Hide watched videos
            BT_HIDE_WATCHED: {
                default: false,
                label: 'Hide watched videos',
                type: 'checkbox',
            },
            // hide channels with keywords
            BT_HIDE_CHANNELS_KEYWORDS: {
                default: '',
                label: 'Exclude channels with keywords(separated by comma)',
                type: 'text',
            },
            // hide videos with keywords in tital
            BT_HIDE_VIDEOS_TITLE_KEYWORDS: {
                default: '',
                label: 'Exclude videos with keywords on tital(separated by comma)',
                type: 'text',
            },
            // Hide videos below threshold views
            BT_HIDE_THRESHOLD_VIEWS: {
                default: 0,
                label: 'Hide/Dim videos below threshold views',
                min: 0,
                type: 'int',
            },
            // hide videos under a certain length in seconds
            BT_HIDE_THRESHOLD_LENGTH: {
                default: 0,
                label: 'Hide/Dim videos under threshold length in seconds',
                min: 0,
                type: 'int',
            },

            // youtube API
            BT_YT_API_KEY: {
                default: '',
                label: 'YouTube API Key',
                type: 'text',
            },
            // hide videos with keywords in description only works with API key
            BT_HIDE_VIDEOS_KEYWORDS_DESC: {
                default: '',
                label: 'Exclude videos with keywords in description(separated by comma) ONLY WORKS WITH API KEY',
                type: 'text',
            },

        },
        id: GMC_ID,
        title,
    });




    addStyle(style);
    const BUTTONS = [{
        /* eslint-disable max-len */
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path fill="currentColor" d="M12 9.5a2.5 2.5 0 0 1 0 5 2.5 2.5 0 0 1 0-5m0-1c-1.93 0-3.5 1.57-3.5 3.5s1.57 3.5 3.5 3.5 3.5-1.57 3.5-3.5-1.57-3.5-3.5-3.5zM13.22 3l.55 2.2.13.51.5.18c.61.23 1.19.56 1.72.98l.4.32.5-.14 2.17-.62 1.22 2.11-1.63 1.59-.37.36.08.51c.05.32.08.64.08.98s-.03.66-.08.98l-.08.51.37.36 1.63 1.59-1.22 2.11-2.17-.62-.5-.14-.4.32c-.53.43-1.11.76-1.72.98l-.5.18-.13.51-.55 2.24h-2.44l-.55-2.2-.13-.51-.5-.18c-.6-.23-1.18-.56-1.72-.99l-.4-.32-.5.14-2.17.62-1.21-2.12 1.63-1.59.37-.36-.08-.51c-.05-.32-.08-.65-.08-.98s.03-.66.08-.98l.08-.51-.37-.36L3.6 8.56l1.22-2.11 2.17.62.5.14.4-.32c.53-.44 1.11-.77 1.72-.99l.5-.18.13-.51.54-2.21h2.44M14 2h-4l-.74 2.96c-.73.27-1.4.66-2 1.14l-2.92-.83-2 3.46 2.19 2.13c-.06.37-.09.75-.09 1.14s.03.77.09 1.14l-2.19 2.13 2 3.46 2.92-.83c.6.48 1.27.87 2 1.14L10 22h4l.74-2.96c.73-.27 1.4-.66 2-1.14l2.92.83 2-3.46-2.19-2.13c.06-.37.09-.75.09-1.14s-.03-.77-.09-1.14l2.19-2.13-2-3.46-2.92.83c-.6-.48-1.27-.87-2-1.14L14 2z"/></svg>',
        /* eslint-enable max-len */
        name: 'Settings',
        type: 'settings',
    }];

    const renderButtons = function () {
        // Find button area target
        const target = findButtonAreaTarget();
        if (!target) {
            debug('Failed to find button area target');            
            return
        };

        // Did we already render the buttons?
        const existingButtons = document.querySelector('.BT-BUTTONS');

        // Generate buttons area DOM
        const buttonArea = document.createElement('div');
        buttonArea.classList.add('BT-BUTTONS');

        // Render buttons
        BUTTONS.forEach(({ icon, iconHidden, name, stateKey, type }) => {
            // For toggle buttons, determine where in localStorage they track state
            const section = determineYoutubeSection();
            const storageKey = [stateKey, section].join('_');
            const toggleButtonState = localStorage.getItem(storageKey) || 'normal';

            // Generate button DOM
            const button = document.createElement('button');
            button.title = type === 'toggle' ? `${name} : currently "${toggleButtonState}" for section "${section}"` : `${name}`;
            button.classList.add('BT-BUTTON');
            if (toggleButtonState !== 'normal') button.classList.add('BT-BUTTON-DISABLED');
            button.innerHTML = toggleButtonState === 'hidden' ? iconHidden : icon;
            buttonArea.appendChild(button);

            // Attach events for toggle buttons
            switch (type) {
                case 'settings':
                    button.addEventListener('click', () => {
                        gmc.open();
                        renderButtons();
                    });
                    break;
            }
        });

        // Insert buttons into DOM
        if (existingButtons) {
            target.replaceChild(buttonArea, existingButtons);
            debug('Re-rendered menu buttons');
        } else {
            target.insertBefore(buttonArea,target.firstChild);
            debug('Rendered menu buttons');
        }
    };

    const run = debounce((mutations) => {

        // don't react if only *OUR* own buttons changed state
        // to avoid running an endless loop

        if (mutations && mutations.length === 1) { return; }

        if (mutations[0].target.classList.contains('BT-BUTTON') ||
            mutations[0].target.classList.contains('BT-BUTTON-SHORTS')) {
            return;
        }

        // something *ELSE* changed state (not our buttons), so keep going
        debug('Running BetterTube cycle');
        renderButtons();
        // ------------------------------
        // Process rules and time it

        console.time('BetterTube processRules');
        processRules();
        console.timeEnd('BetterTube processRules');

       


    }, 250);

    setTimeout(() => {
        observeDOM(document.body, run);
        renderButtons();
    }, 1000);

    debug("ended");
}



init();
