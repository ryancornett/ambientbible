import { booksList, chaptersList, audio, sounds, apiRef, rates, cache, UpdateCache } from "./data.js";
import BuildChapter from "./builder.js";
import Footer from "./footer.js";
import Theme from "./theme.js";

//#region soundsPlayer

const soundsPlayer = new Audio();
let gainNode;
let soundsInitialized = false;

async function initializeSoundsResources() {
    soundsInitialized = true;
    soundsPlayer.src = sounds[0].file;
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const track = audioContext.createMediaElementSource(soundsPlayer);
    gainNode = audioContext.createGain();
    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-30, audioContext.currentTime);
    compressor.knee.setValueAtTime(30, audioContext.currentTime);
    compressor.ratio.setValueAtTime(3, audioContext.currentTime);
    compressor.attack.setValueAtTime(0.35, audioContext.currentTime);
    compressor.release.setValueAtTime(0.35, audioContext.currentTime);
    track.connect(gainNode).connect(compressor).connect(audioContext.destination);
    gainNode.gain.value = 0.25;
};

soundsPlayer.addEventListener("ended", async function () { soundsPlayer.play(); });

const soundsSelector = document.getElementById('sounds');
function InitializeSoundsSelectorToSummerRain() {
    soundsSelector.options[0].remove();
    sounds.forEach((sound, index) => {
        let option = new Option(sound.title, index);
        if (sound === "Summer Rain") {
            option.selected = true;
        }
        soundsSelector.options[soundsSelector.options.length] = option;
    });
};

const bg = document.querySelector('.background');
soundsSelector.addEventListener('change', () => {
    soundsPlayer.src = sounds[soundsSelector.value].file;
    bg.setAttribute('style', `background-image: url(${sounds[soundsSelector.value].bg})`);
    soundsPlayer.play();
})

//#endregion soundsPlayer

//#region bookSelector

const bookSelector = document.getElementById('book-selector');
(function InitializeBookSelectorToJohn() {
    booksList.forEach((book, index) => {
        let option = new Option(book, index);
        if (book === "John") {
            option.selected = true;
        }
        bookSelector.options[bookSelector.options.length] = option;
    });
})();

const SELECT_CHAPTER_OPTION = "- select chapter -";

bookSelector.addEventListener("change", function () {
    chapterSelector.innerHTML = '';
    let placeholderOption = document.createElement("option");
        placeholderOption.disabled = true;
        placeholderOption.selected = true;
        placeholderOption.text = SELECT_CHAPTER_OPTION;
        chapterSelector.add(placeholderOption);
    for (let i = 1; i <= chaptersList[bookSelector.value]; i++) {
        chapterSelector.options[chapterSelector.options.length] = new Option(i, i);
    }
});

//#endregion bookSelector

//#region chapterSelector

const chapterSelector = document.getElementById('chapter-selector');
(function InitializeChapterSelectorForJohn1() {
    let placeholderOption = document.createElement("option");
    placeholderOption.disabled = true;
    placeholderOption.text = SELECT_CHAPTER_OPTION;
    chapterSelector.add(placeholderOption);
    
    for (let i = 1; i <= chaptersList[42]; i++) {
        let option = new Option(i, i);
        if (i === 1) {
            option.selected = true;
        }
        chapterSelector.options[chapterSelector.options.length] = option;
    }
})();

chapterSelector.addEventListener("input", playChapter);

//#endregion chapterSelector

//#region interactive controls

let restartClickable = document.querySelectorAll('.restart');
restartClickable.forEach(btn => { btn.addEventListener('click', playChapter); })

let selectedRate = 0;
const playbackRateSelector = document.getElementById('playback-rate-selector');
playbackRateSelector.addEventListener("click", function () {
    selectedRate = selectedRate == 6 ? selectedRate = 0 : ++selectedRate;
    setPlaybackRate();
});

function setPlaybackRate() {
    playbackRateSelector.textContent = "";
    playbackRateSelector.textContent = Object.keys(rates[selectedRate]);
    biblePlayer.playbackRate = Object.values(rates[selectedRate]);
};
//#endregion interactive controls

//#region soundsVolumeIcon
const soundsVolumeIcon = document.getElementById('sounds-volume-icon');
const soundsVolumeSelector = document.querySelector('#sounds-volume');

soundsVolumeSelector.addEventListener('change', function () {
    gainNode.gain.value = soundsVolumeSelector.value;
    if (soundsVolumeSelector.value <= 0.05) { soundsVolumeIcon.src = "assets/icons/muted.webp"; }
    else if (soundsVolumeSelector.value > 0.05 && soundsVolumeSelector.value <= 0.2) { soundsVolumeIcon.src = "assets/icons/quiet.webp"; }
    else if (soundsVolumeSelector.value > 0.2 && soundsVolumeSelector.value <= 0.4) { soundsVolumeIcon.src = "assets/icons/medium.webp"; }
    else { soundsVolumeIcon.src = "assets/icons/loud.webp"; }
});

soundsVolumeSelector.addEventListener('touchend', function() {
    soundsVolumeSelector.dispatchEvent(new Event('change'));
    soundsPlayer.muted = true;
    soundsPlayer.muted = false;
});

soundsVolumeIcon.onclick = function handleQuickMute() {
    if (soundsVolumeSelector.value < 0.06) {
        soundsVolumeSelector.value = 0.25;
        gainNode.gain.value = 0.25;
    }
    else {
        soundsVolumeSelector.value = 0;
        gainNode.gain.value = 0;
    }
    soundsVolumeSelector.dispatchEvent(new Event('change'));
}
//#endregion soundsVolumeIcon

//#region Translation picker

const kjv = 'eng-kjv2006';
const bsb = 'BSB';
let translation = bsb;

const translationPicker = document.querySelector('.translation-picker');
const kjvPicker = document.getElementById('kjv');
const bsbPicker = document.getElementById('bsb');
let translationFlag = false;
translationPicker.addEventListener('click', async function () {
    kjvPicker.classList.toggle('selected');
    bsbPicker.classList.toggle('selected');
    translation = translation == kjv ? bsb : kjv;
    translationFlag = true;
    // First call of playPauseLogic stops the player if playing, changes the translation, & changes the flag to false; the second restarts it if necessary
    await playChapter();
    if (!isPlaying) { await playChapter(); }
})

//#endregion Translation picker

//#region biblePlayer

const biblePlayer = document.getElementById('bible-player');
biblePlayer.volume = 1;
biblePlayer.src = audio["John"][0][translation];

biblePlayer.addEventListener("ended", function () {
    try {
        if (biblePlayer.src == audio["Revelation"][21][translation]) { handleEndOfRevelation(); }
        else if (chapterSelector.value == chaptersList[bookSelector.value]) {handleEndOfAllBooksExceptRevelation(); }
        else {
            handleEndOfAllChaptersExceptLastChapter(translation);
        }
        chapterSelector.dispatchEvent(new Event('input'));
    } catch(error) {
        console.log(error);
    }
})

function handleEndOfRevelation() {
    bookSelector.selectedIndex = 0;
    bookSelector.dispatchEvent(new Event('change'));
    chapterSelector.selectedIndex = 1;
}

function handleEndOfAllBooksExceptRevelation() {
    bookSelector.selectedIndex = parseInt(bookSelector.value) + 1;
    bookSelector.dispatchEvent(new Event('change'));
    chapterSelector.selectedIndex = 1;
}

function handleEndOfAllChaptersExceptLastChapter(selectedTranslation) {
    biblePlayer.src = audio[booksList[bookSelector.value]][chapterSelector.value][selectedTranslation];
    chapterSelector.selectedIndex = parseInt(chapterSelector.value) + 1;
}

//#endregion biblePlayer

//#region Bible controls

const nextButton = document.querySelector('.next');
nextButton.addEventListener('click', () => {
    if (chapterSelector.value != SELECT_CHAPTER_OPTION) { biblePlayer.dispatchEvent(new Event('ended')); }
})

const previousButton = document.querySelector('.previous');
previousButton.addEventListener('click', () => {
    if (chapterSelector.value != SELECT_CHAPTER_OPTION) {
        if (biblePlayer.src == audio["Genesis"][0][translation]) { 
            biblePlayer.src = audio["Revelation"][21][translation];
            bookSelector.selectedIndex = 65;
            chapterSelector.selectedIndex = chaptersList[bookSelector.value];
        }
        else if (chapterSelector.value == 1) {
            bookSelector.selectedIndex = parseInt(bookSelector.value) - 1;
            bookSelector.dispatchEvent(new Event('change'));
            chapterSelector.selectedIndex = chaptersList[bookSelector.value];
        }
        else {
            chapterSelector.selectedIndex = chapterSelector.selectedIndex - 1;
        }
        chapterSelector.dispatchEvent(new Event('input'));
    }    
});

//#endregion Bible controls

//#region Chapter audio timer

const timer = document.querySelector('#timer');
function formatTime(seconds) {
    const minutes = Math.floor((seconds / biblePlayer.playbackRate) / 60);
    const secondsLeft = Math.floor((seconds / biblePlayer.playbackRate) % 60);
    return `${String(minutes).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')}`;
}

function updateTimer() {
    const elapsedTime = formatTime(biblePlayer.currentTime);
    const totalTime = formatTime(biblePlayer.duration);
    timer.textContent = `${elapsedTime} / ${totalTime}`;
}

const interval = setInterval(() => {
    // Ensure the audio metadata has been loaded before updating the timer
    if (!isNaN(biblePlayer.duration)) {
        updateTimer();
    }
}, 500);

biblePlayer.addEventListener('loadedmetadata', updateTimer);

//#endregion Chapter audio timer

//#region Play/Pause Logic

let isPlaying = false;

async function playPauseLogic() {
    if (soundsInitialized == false) {
        await initializeSoundsResources();
        InitializeSoundsSelectorToSummerRain();
    }
    isPlaying = !isPlaying;
    if (isPlaying) {
        if (translationFlag) {
            biblePlayer.src = audio[booksList[bookSelector.value]][chapterSelector.value-1][translation];
            translationFlag = false;
        }
        soundsPlayer.play();
        biblePlayer.play();
        playPauseButton.forEach(btn => {
            btn.src = "assets/icons/pause.webp";
        });
    }
    else {
        soundsPlayer.pause();
        biblePlayer.pause();
        playPauseButton.forEach(btn => {
            btn.src = "assets/icons/play.webp";
        });
    }
};

async function playChapter() {
    if (soundsInitialized == false) {
        await initializeSoundsResources();
        InitializeSoundsSelectorToSummerRain();
    }
    await displayChapterText();
    biblePlayer.src = audio[booksList[bookSelector.value]][chapterSelector.value-1][translation];
    if (playedInitially) {
        isPlaying = false;
        biblePlayer.pause();
        playPauseLogic();
        setPlaybackRate();
    }
};

let playedInitially = false;
const playPauseButton = document.querySelectorAll('.play-pause');
playPauseButton.forEach(btn => {
    btn.addEventListener('click', function () {
        playedInitially = true;
        playPauseLogic();
    });
});

//#endregion Play/Pause Logic

//#region Get Chapter Text

const chapterContainer = document.querySelector('.chapter-container');

async function GetChapterData() {
    let bookIndex = parseInt(bookSelector.value);
    try {
        const response = await fetch(`https://bible.helloao.org/api/${translation}/${apiRef[bookIndex]}/${chapterSelector.value}.json`);
        if (response.ok) {
            const chapter = await response.json();
            UpdateCache(translation, chapter);
            return chapter;
        }
    } catch (error) {
        chapterContainer.textContent = "Bible text not available at this time.";
        return null;
    }
};

const bsbAttribution = "The Holy Bible, Berean Standard Bible, BSB is produced in cooperation with Bible Hub, Discovery Bible, OpenBible.com, and the Berean Bible Translation Committee. This text of God's Word has been dedicated to the public domain.";
const kjvAttribution = "King James Bible.";
const attributionNotice = document.createElement('div');
attributionNotice.classList.add('attribution');
const translationCredit = document.createElement('p');
translationCredit.textContent = translation == bsb ? bsbAttribution : kjvAttribution;
const apiCredit = document.createElement('p');
apiCredit.textContent = "Courtesy of bible.helloao.org.";
attributionNotice.appendChild(translationCredit);
attributionNotice.appendChild(apiCredit);

async function displayChapterText() {
    chapterContainer.innerHTML = "";
    let chapterComponents;
    if (cache[`${apiRef[bookSelector.value]}${chapterSelector.value}${translation}`]) {
        chapterComponents = await BuildChapter(cache[`${apiRef[bookSelector.value]}${chapterSelector.value}${translation}`]);
    }
    else {
        try {
            chapterComponents = await BuildChapter(await GetChapterData());
        } catch (error) {
            console.log(error);
            chapterContainer.textContent = "Bible text not available at this time.";
        }
    }

    if (translation == kjv) { chapterContainer.appendChild(Object.assign(document.createElement('p'),{classList:"kjv-p-top"})); }
    if (chapterComponents != null) {
        chapterComponents.forEach(item => {
            chapterContainer.append(item);
            translationCredit.textContent = translation == bsb ? bsbAttribution : kjvAttribution;
            chapterContainer.appendChild(attributionNotice);
        })
    }
};

await displayChapterText();

//#endregion Get Chapter Text

Theme(chapterContainer);
Footer();
