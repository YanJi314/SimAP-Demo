const SimAPTools = {
	getPalette(sourceImage) {
		// 读取图片数据
		const canvas = document.createElement("canvas");
		canvas.width = sourceImage.width;
		canvas.height = sourceImage.height;
		const ctx = canvas.getContext("2d");
		ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);
		const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
		// 读取图片颜色
		const pixelArray = [];
		const pixelCount = canvas.width * canvas.height;
		for (let i = 0, offset, r, g, b; i < pixelCount; i = i + Math.round(pixelCount / 500)) {
			offset = i * 4;
			r = pixels[offset + 0];
			g = pixels[offset + 1];
			b = pixels[offset + 2];
			pixelArray.push([r, g, b]);
		}
		return pixelArray;
	},
	getTopColors(sourceImage) {
		const colors = this.getPalette(sourceImage);
		let colorCounts = new Map();
		colors.forEach(color => {
			let found = false;
			for (let [mergedColor, count] of colorCounts) {
				const colorDistance = Math.sqrt(
					Math.pow(color[0] - mergedColor[0], 2) +
					Math.pow(color[1] - mergedColor[1], 2) +
					Math.pow(color[2] - mergedColor[2], 2)
				);
				if (colorDistance < 80) {
					const newColor = [
						Math.floor((mergedColor[0] * count + color[0]) / (count + 1)),
						Math.floor((mergedColor[1] * count + color[1]) / (count + 1)),
						Math.floor((mergedColor[2] * count + color[2]) / (count + 1))
					];
					colorCounts.delete(mergedColor);
					colorCounts.set(newColor, count + 1);
					found = true;
					break;
				}
			}
			if (!found) {
				colorCounts.set(color, 1);
			}
		});
		let sortedColors = Array.from(colorCounts.entries()).sort((a, b) => b[1] - a[1]);
		return sortedColors.slice(0, 4).map(entry => entry[0]);
	},
	formatTime(time) {
		let minutes = Math.floor(time / 60);
		let seconds = Math.floor(time % 60);
		return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
	},
}

const initializeSimAP = (config) => {
	// 初始化界面
	document.getElementById("album").src = config.album;
	document.querySelector(".musicInfo>b").innerText = config.title;
	document.querySelector(".musicInfo>div").innerText = config.artist;
	document.getElementById("audio").src = config.audio;
	// 初始化背景
	document.getElementById("album").onload = () => {
		const themeColors = SimAPTools.getTopColors(document.getElementById("album"));
		document.getElementById("background").style.background = `linear-gradient(135deg, rgb(${themeColors[0].join(",")}), rgba(${themeColors[0].join(",")},.7))`;
		document.getElementById("animationCenter").style.background = `rgb(${themeColors[1] ? themeColors[1].join(",") : "255,255,255"})`;
		document.getElementById("animationLeft").style.background = `rgba(${themeColors[2] ? themeColors[2].join(",") : "255,255,255"},.8)`;
		document.getElementById("animationRight").style.background = `rgba(${themeColors[3] ? themeColors[3].join(",") : "255,255,255"},.6)`;
		const themeColorNum = 255 / (themeColors[0][0] + themeColors[0][1] + themeColors[0][2]);
		document.body.style.setProperty("--SimAPTheme", `rgb(${themeColors[0].map(num => num * themeColorNum).join(",")})`);
	}
	// 初始化音频控件
	const audio = document.getElementById("audio");
	const current = document.getElementById("progressCurrent");
	const duration = document.getElementById("progressDuration");
	const progress = new SimProgress(document.getElementById("progressBar"));
	const initAudio = () => {
		progress.max = audio.duration;
		progress.setValue(0);
		duration.innerText = SimAPTools.formatTime(audio.duration);
		progress.onchange = value => { audio.currentTime = value; }
	}
	audio.addEventListener("loadedmetadata", initAudio);
	audio.addEventListener("timeupdate", () => {
		progress.setValue(audio.currentTime);
		current.innerText = SimAPTools.formatTime(audio.currentTime);
		document.body.classList[!audio.paused ? "add" : "remove"]("playing");
	});
	// 初始化歌词
	const slrc = new SimLRC(config.lyrics);
	slrc.render(document.querySelector(".lyrics>div"), audio, {align: "left", lineSpace: .5, activeColor: "var(--SimAPTheme)"});
};

const SimAPControls = {
	togglePlay() {
		document.body.classList[audio.paused ? "add" : "remove"]("playing");
		audio[audio.paused ? "play" : "pause"]();
	},
	prev() { alert("未实现。"); },
	next() { alert("未实现。"); },
	toggleLoop() { alert("未实现。"); },
	toggleVolume() {
		const volIcon = document.querySelector(".volBtn i");
		if (document.body.classList.contains("volume") && event.target == volIcon) {
			const audio = document.getElementById("audio");
			audio.muted = !audio.muted;
		} else if (audio.muted) {
			audio.muted = false;
		} else {
			document.body.classList.add("volume");
		}
		volIcon.innerHTML = audio.muted ? "&#xF29E;" : "&#xF2A2;";
	},
	toggleList() {
		document.body.classList[document.body.classList.contains("hideList") ? "add" : "remove"]("hideList");
		document.body.classList[document.body.classList.contains("hideList") ? "remove" : "add"]("hideList");
		if (!document.body.classList.contains("hideList")) document.body.classList.add("hideLyrics");
	},
	toggleLyrics() {
		document.body.classList[document.body.classList.contains("hideLyrics") ? "add" : "remove"]("hideLyrics");
		document.body.classList[document.body.classList.contains("hideLyrics") ? "remove" : "add"]("hideLyrics");
		if (!document.body.classList.contains("hideLyrics")) document.body.classList.add("hideList");
	},
};

const SimAPVolume = new SimProgress(document.getElementById("volBar"));
SimAPVolume.onchange = value => {
	document.getElementById("audio").volume = value;
	document.getElementById("audio").muted = false;
}
document.body.onpointerdown = () => {document.body.classList.remove("volume");}
document.querySelector(".volBtn").onpointerdown = e => e.stopPropagation();