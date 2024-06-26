let verses = [];

export default async function BuildChapter(data) {
    return HandleBSB(data);
}

async function HandleBSB(data) {
    verses = [];
    let arr = await data.chapter.content;
    arr.forEach(item => {
        if (item.type == "heading") {
            HandleHeading(item);
        }
        if (item.type == "line_break") {
            HandleLineBreak();
        }
        if (item.type == "hebrew_subtitle") {
            HandleHebrewSubtitle(item);
        }
        if (item.type == "verse") {
            HandleVerse(item);
        }
    });
    return verses;
}

async function HandleKJV(data) {
    console.log("Not implemented.");
}

function HandleHeading(item) {
    let heading = document.createElement('h4');
    heading.classList.add('verse-heading');
    for (let i = 0; i < item.content.length; i++) {
        heading.textContent += item.content[i];
    }
    verses.push(heading);
};

function HandleLineBreak() {
    let lineBreak = document.createElement('p');
    lineBreak.classList.add('line-break');
    verses.push(lineBreak);
};

function HandleHebrewSubtitle(item) {
    let hebrewSubtitle = document.createElement('h5');
    hebrewSubtitle.classList.add('hebrew-subtitle');
    for (let i = 0; i < item.content.length; i++) {
        if (item.content[i].text) {
            hebrewSubtitle.textContent += `${item.content[i].text} `;
        }
    }
    verses.push(hebrewSubtitle);
};

function HandleVerse(item) {
    let verse = document.createElement('div');
    verse.classList.add('verse');
    let verseNumber = document.createElement('span');
    verseNumber.classList.add('verse-number');
    verseNumber.textContent = item.number;
    verse.appendChild(verseNumber);

    let versePart = document.createElement('span');
    versePart.classList.add('verse-part');

    for (let i = 0; i < item.content.length; i++) {
        let p = document.createElement('p');
        if (typeof item.content[i] === 'string' && item.content[i].includes("BOOK")) {
            continue;
        } else if (typeof item.content[i] === 'string') {
            versePart.textContent += item.content[i];
        } else if (item.content[i] && 'poem' in item.content[i]) {
            let poemLine = document.createElement('span');
            let indent = item.content[i].poem;
            poemLine.classList.add(`indent-${indent}`);
            poemLine.textContent = `${item.content[i].text} `;
            versePart.appendChild(poemLine);
            if (item.content[i+1] && item.content[i+1].noteId) {
                continue;
            } else {
                versePart.appendChild(p);
            }

            if (item.content[i-1] && item.content[i-1].noteId) {
                poemLine.classList.remove(`indent-${indent}`);
                poemLine.textContent = "\u00A0" + poemLine.textContent;
            }
        } else if (item.content[i] && 'text' in item.content[i]) {
            versePart.textContent += item.content[i].text;
        }
    }
    let placeholder = versePart.textContent;
    let takeOutParagraphSymbols = placeholder.replace("¶ ", "");
    let takeOutNewLineCharacters = takeOutParagraphSymbols.replace(`\\n`, "\u00A0 ");
    versePart.textContent = takeOutParagraphSymbols;
    verse.appendChild(versePart);
    verses.push(verse);
};