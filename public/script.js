const input_link = document.getElementById("input_link");
const download_button = document.getElementById("download_button");
const convert_button = document.getElementById("convert_button");
const error_text = document.getElementById("error_text");
const toggle_button = document.getElementById("toggle_button");

if (!localStorage.getItem("theme")) {
    localStorage.setItem("theme", "dark");
}

if (localStorage.getItem("theme") === "dark") {
    document.documentElement.classList.add("dark");
    toggle_button.innerHTML = "Light?";
} else if  (localStorage.getItem("theme") === "light") {
    document.documentElement.classList.add("light");
    toggle_button.innerHTML = "Dark?";
}

toggle_button.addEventListener('click', () => {
    document.documentElement.classList.toggle("dark");

    if (document.documentElement.classList.contains("dark")) {
        localStorage.setItem("theme", "dark");
        toggle_button.innerHTML = "Light?";
    } else {
        localStorage.setItem("theme", "light");
        toggle_button.innerHTML = "Dark?";
    }
});

let dot_count = 0;
const max_dots = 3;

function dots_convert_button() {
    dot_count = (dot_count + 1) % (3 + 1);
    const dots = '.'.repeat(dot_count);
    convert_button.innerHTML = `<i class="fa-solid fa-gear"></i> Conversion${dots}`;
}

function valid_url(url) {
    if (!/^https?:\/\//.test(url)) {
      return "https://" + url;
    }
    return url;
}

input_link.addEventListener("input", () => {
    const detect_regex = /^(?:https?:\/\/)?(www\.)?wallpaperengine\.space\/wallpaper\/[^"]/;

    if (input_link.value == "") {
        download_button.classList.add("opacity-50", "cursor-not-allowed", "pointer-events-none");
        error_text.classList.add("hidden");
    }

    if (detect_regex.test(input_link.value)) {
        download_button.classList.remove("opacity-50", "cursor-not-allowed", "pointer-events-none");
    } else {
        download_button.classList.add("opacity-50", "cursor-not-allowed", "pointer-events-none");
    }
})

download_button.addEventListener("click", async function() {
    try {
        download_button.classList.add("hidden");
        convert_button.classList.remove("hidden");
        setInterval(dots_convert_button, 600);
        error_text.classList.add("hidden");
        const wallpaper_link = input_link.value;

        const response = await fetch("/download", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "input_link": wallpaper_link
            })
        });

        if (!response.ok) throw new Error(response.status);

        const content_disposition_header = response.headers.get("Content-Disposition")
        let filename = "Wallpaper [WallpaperEngineSpace-downloader].mp4";

        if (content_disposition_header) {
            const filename_regex = /filename="([^"]+)"/;
            filename = filename_regex.exec(content_disposition_header)[1];
        }

        const array_buffer = await response.arrayBuffer();
        const unint8_array = new Uint8Array(array_buffer);
        
        const transmuxer = new muxjs.Transmuxer({
            keepOriginalTimestamps: true
          });

        const mp4_segments = [];

        transmuxer.on('data', (segment) => {
            mp4_segments.push(segment.initSegment);
            mp4_segments.push(segment.data);

            console.log(segment);
        });

        transmuxer.on('done', () => {
            const mp4_blob = new Blob(mp4_segments, { type: 'video/mp4' });
            const url = window.URL.createObjectURL(mp4_blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();

            window.URL.revokeObjectURL(url);

            download_button.classList.remove("hidden");
            convert_button.classList.add("hidden");
        });

        transmuxer.push(unint8_array);
        transmuxer.flush();
        
    } catch (error) {
        download_button.classList.remove("hidden");
        convert_button.classList.add("hidden");

        if (error.message === "404") {
            error_text.innerHTML = `<i class="fa-solid fa-xmark"></i> Error: wallpaper not found`;
        } else if (error.message === "400") {
            error_text.innerHTML = `<i class="fa-solid fa-xmark"></i> Error: please enter a valid WallpaperEngineSpace link`;
        } else {
            console.log(error)
            error_text.innerHTML = `<i class="fa-solid fa-xmark"></i> Error: unknown error`;
        }

        error_text.classList.remove("hidden");
    }
});
