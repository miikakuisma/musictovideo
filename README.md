This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

# Music to Video converter

Motivation to build this project was to generate video file from music file. I noticed that services like Facebook don't actually support music.. sure you can post link to SoundCloud etc but you cannot get your music files playing in NewsFeed. However videos are supported so I was thinking, why not create videos that look like music players? So I did this simple web app. The video generated with this app displays waveform data of the audio and then creates video in which that waveform is showing music progressing, very much how standard music player works, but only as a video.

## Demo

Example: [https://www.facebook.com/miikakuisma/videos/443893596203718/](https://www.facebook.com/miikakuisma/videos/443893596203718/)

## Installation

- Install Node JS
- Install FFMPEG
- run `npm install` or `yarn` to install the dependencies
- start transcoder server with `node server` (or maybe you want to use PM2 or something similar)
- start client with `npm start` or `yarn start`
- Go to localhost:3000 and it should work!

