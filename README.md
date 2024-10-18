# WallpaperEngineSpace-downloader
## Download wallpapers directly from [wallpaperengine.space](https://wallpaperengine.space)

### https://wallpaperenginespace-downloader.vercel.app

<h1 align="center">
	<a href="#"><img src="https://i.imgur.com/VwsdHYj.png"></a>
</h1>

# Use

## - Use on the web

Go to https://wallpaperenginespace-downloader.vercel.app and paste the URL of a wallpaper from [wallpaperengine.space](https://wallpaperengine.space)

## - Use locally

- Install the latest version of NodeJs: https://nodejs.org

- Clone the GitHub repository:

```
git clone https://github.com/spel987/WallpaperEngineSpace-downloader.git
```

- Install dependencies:

```
npm i
```

- Start the Express server:

```
node index.js
```

# Known bug

I'm currently using [Mux.js](https://github.com/videojs/mux.js/) to transmux the MPEG-TS stream into MP4 on the frontend. But this causes a bug in the metadata. The length of the video file is not correct and is far too long. Don't worry, this doesn't affect the use of the video file in WallpaperEngine or even playback with VLC, for example. It's just that the duration displayed is not the real duration.

## How it works

<h1 align="center">
	<a href="#"><img src="https://i.imgur.com/zW22y90.png"></a>
</h1>

# Credits

### Developer:

- spel987<br>
    Email: `spel987@pm.me`<br>
    GitHub: https://github.com/spel987
### Backend

- NodeJs: https://nodejs.org
- Express: https://expressjs.com/
### Frontend

- Tailwind CSS: https://tailwindcss.com/
- Font Awesome: https://fontawesome.com
- Flaticon (and author [Anggara](https://www.flaticon.com/authors/anggara)): https://www.flaticon.com/free-icon/gallery_8138449
- Mux.js: https://github.com/videojs/mux.js/

# Suggestions

If you have any questions or suggestions, please open an [issue](https://github.com/spel987/WallpaperEngineSpace-downloader/issues).
