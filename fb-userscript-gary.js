// ==UserScript==
// @name         FB Story Download
// @namespace    http://tampermonkey.net/
// @version      2023-12-15
// @description  try to take over the world!
// @author       You
// @match        https://*.facebook.com/stories/*
// @match        https://*.facebook.com/story/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=facebook.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
    const downloadFile = (fileUri, fileName) => {
        fetch(fileUri)
        // check to make sure you didn't have an unexpected failure (may need to check other things here depending on use case / backend)
            .then(resp => resp.status === 200 ? resp.blob() : Promise.reject('something went wrong'))
            .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            // the filename you want
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        })
            .catch(() => alert('Failed to download'));
    };

    const parseStory = () => {
        let f = Array.from(document.querySelectorAll('script[type="application/json"]')).map(e => e.innerHTML)
        .filter(e => e.indexOf('RelayPrefetchedStreamCache') !== -1)
        .filter(e => e.indexOf('unified_stories') !== -1)
        .filter(e => e.indexOf('story_video_thumbnail') !== -1);

        //let a = Array.from(document.querySelectorAll('script[type="application/json"]')).map(e => e.innerHTML).find(e => e.indexOf('browser_native_hd_url') !== -1);
        let a = f[0];
        //console.log(a);
        let b = JSON.parse(a);

        let d = b.require[0][3][0].__bbox.require;
        //console.log(d);
        //search for key with corresponding 'RelayPrefetchedStreamCache'
        const e = d.find(key => key[0] === 'RelayPrefetchedStreamCache');
        //console.log(e);

        // get title
        const title = e[3][1].__bbox.result.data.bucket.story_bucket_owner.short_name;
        //console.log(title);

        // working out pictures from videos
        const currentView = document.querySelector('[data-id]').getAttribute('data-id');
        //console.log(currentView);
        const c = e[3][1].__bbox.result.data.bucket.unified_stories.edges;

        //console.log(c);


        //const c =b.require[0][3][0].__bbox.require[0][3][1].__bbox.result.data.bucket.unified_stories.edges;
        const stories = [];
        c.forEach(story => {
            stories.push(story.node);
        });

        const currentStory = stories.find(story => story.id === currentView)
        //console.log(currentStory);

        // determine if picture of video
        const storyType = currentStory.attachments[0].media.__typename;
        if (storyType === 'Photo') {
            let fileUri = currentStory.attachments[0].media.image.uri;
            let fileName = `${title} ${currentStory.attachments[0].media.id}.jpg`;
            downloadFile(fileUri, fileName);
        }
        else if (storyType === 'Video') {
            let fileUri = currentStory.attachments[0].media.browser_native_hd_url;
            let fileName = `${title} ${currentStory.attachments[0].media.id}.mp4`;
            downloadFile(fileUri, fileName);
        }
    };

    const parseMobile = () => {
        // get the title
        const title = document.querySelector('.overflowText').innerHTML;
        const timestamp = new Date().valueOf();

        // check for video first
        const videoElement = document.querySelector('video');
        if (videoElement) {
            let fileUri = videoElement.getAttribute('src')
            let fileName = `${title} ${timestamp}.mp4`;
            downloadFile(fileUri, fileName);
        }
        else {
            const a = document.querySelector('img.picture');
            const imgSrc = a.getAttribute('src');
            let fileUri = imgSrc;
            let fileName = `${title} ${timestamp}.jpg`;
            downloadFile(fileUri, fileName);
        }
    };

    let parentElement = document.querySelector('body');
    var btn = document.createElement('button');
    btn.textContent = 'Download';
    btn.style.position = 'absolute';
    btn.style.top = '50vh';
    btn.style.left = '50vw';
    btn.addEventListener('click', function() {
        const isMobile = document.querySelector('.touch');
        if (isMobile) {
            parseMobile();
        }
        else {
            parseStory();
        }
    });
    parentElement.appendChild(btn);

})();