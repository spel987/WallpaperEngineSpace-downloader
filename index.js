const express = require('express');
const path = require('path');
const cors = require('cors');
const stream = require('stream');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const BASE_REGEX = /https:\/\/video\.squarespace-cdn\.com\/content\/v1\/5fe4caeadae61a2f19719512\/([a-f0-9-]+)\//;
const MPEG_FILE_REGEX = /segments\/mpegts-h264-1920:1080/;

async function download_decrypt_segment(segmentUrl, byterange, key, iv) {
    const [range, offset] = byterange.split('@').map(Number);
    
    const response = await axios.get(segmentUrl, {
        headers: { Range: `bytes=${offset}-${offset + range - 1}` },
        responseType: 'arraybuffer'
    });

    const cipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    let decrypted = cipher.update(Buffer.from(response.data));
    decrypted = Buffer.concat([decrypted, cipher.final()]);

    return decrypted;
}

async function process_m3u8(input_url) {
    const { data: m3u8_playlist } = await axios.get(input_url);

    const video_m3u8_regex = new RegExp(BASE_REGEX.source + MPEG_FILE_REGEX.source + '.m3u8?[^"]+');
    const video_m3u8_url = video_m3u8_regex.exec(m3u8_playlist)[0];

    const { data: video_m3u8 } = await axios.get(video_m3u8_url);

    const segement_regex = /#EXT-X-BYTERANGE:(\d+@\d+)\n(https:\/\/video\.squarespace-cdn\.com\/content\/v1\/5fe4caeadae61a2f19719512\/([a-f0-9-]+)\/segments\/mpegts-h264-1920:1080)/gm;
    const key_regex = /#EXT-X-KEY:METHOD=AES-128,URI="([^"]+)",IV=0x([0-9a-f]+)/;

    const key_match = key_regex.exec(video_m3u8);
    const m3u8_key_url = key_match[1];
    const key = key_match[2];

    const segments = [];
    let segment_match;

    while ((segment_match = segement_regex.exec(video_m3u8)) !== null) {
        segments.push({
            url: segment_match[2],
            byterange: segment_match[1]
        });
    }

    const m3u8_core = {
        segments: segments,
        m3u8_key_url: m3u8_key_url,
        key: key
    };

    return m3u8_core;
}

function valid_url(url) {
    if (!/^https?:\/\//.test(url)) {
      return "https://" + url;
    }
    return url;
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/download', async (req, res) => {
    const input_link = req.body.input_link;
    let m3u8_url = "";
    const detect_regex = /^(?:https?:\/\/)?(www\.)?wallpaperengine\.space\/wallpaper\/[^"]/;

    if (!input_link) {
        return res.status(400).json({message: "No URL given"});
    }

    if (detect_regex.test(input_link)) {
        const wallpaper_link = valid_url(input_link);
        const url_parts = wallpaper_link.split("/");
        let wallpaper_name = url_parts[url_parts.length - 1];
        wallpaper_name = wallpaper_name.split("?")[0] + " [WallpaperEngineSpace-downloader].mp4";

        try {
            const { data } = await axios.get(wallpaper_link);
            m3u8_url = BASE_REGEX.exec(data)[0] + "playlist.m3u8";
        } catch (error) {
            if (error.response && error.response.status === 404) {
                return res.status(404).json({message: "404 not found"})
            }
        }

        const { segments, m3u8_key_url, key } = await process_m3u8(m3u8_url);

        const m3u8_iv = Buffer.from(key, "hex");

        const response = await axios.get(m3u8_key_url, { responseType: "arraybuffer" });
        const decrypt_key = Buffer.from(response.data);

        res.writeHead(200, {
            'Content-Type': "video/mp4",
            'Content-Disposition': `attachment; filename="${wallpaper_name}"`,
        });

        const passthrough = new stream.PassThrough();

        passthrough.pipe(res);

        for (const segment of segments) {
            const decrypted_segment = await download_decrypt_segment(segment.url, segment.byterange, decrypt_key, m3u8_iv);
            passthrough.write(decrypted_segment);
        }

        passthrough.end();
    } else {
        return res.status(400).json({message: "Invalid link"})
    }
});

app.get('/github', function(req, res){
    res.redirect('https://github.com/spel987/WallpaperEngineSpace-downloader');
});

app.get('*', function(req, res){
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.use('*', function(req, res){
    res.status(404).json({message: "nothing should be sent here?"});
});
  
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});