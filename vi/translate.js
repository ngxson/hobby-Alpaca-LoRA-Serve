const fs = require('fs');
const { translate } = require('bing-translate-api');
const alpaca_data_cleaned = require('./alpaca_data_cleaned.json');
const randomUseragent = require('random-useragent');

let ua = randomUseragent.getRandom();

if (!fs.existsSync('./_tmp')) fs.writeFileSync('./_tmp', '');
const _tmp_done = JSON.parse(`[
  ${fs.readFileSync('./_tmp').toString()}
  {"skip":true}
]`).filter(obj => !obj.skip);

const _done_instructions = {};
_tmp_done.forEach(({ instruction }) => _done_instructions[instruction] = true);

const randomIntFromInterval = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
const delay = ms => new Promise(r => setTimeout(r, ms));
const translateENtoVI = async (text) => {
  const paragraphs = [];
  const sentences = text.split('. ');
  let curr_paragraph = '';
  for (const sentence of sentences) {
    if (sentence.length + '. '.length + curr_paragraph.length < 1000) {
      curr_paragraph += sentence + '. ';
    } else {
      paragraphs.push(curr_paragraph);
      curr_paragraph = '';
    }
  }
  paragraphs.push(curr_paragraph);
  const res = [];
  let j = 0;
  for (const p of paragraphs) {
    while (true) {
      try {
        const { translation } = await translate(p, 'en', 'vi', false, false, ua);
        res.push(translation);
        break;
      } catch (e) {
        console.error(e);
        j++;
        ua = randomUseragent.getRandom();
        if (j === 5) return null;
        await delay(randomIntFromInterval(50000, 80000));
      }
    }
    await delay(randomIntFromInterval(5000, 10000));
  }
  return res.join(' ');
};

const shouldSkip = (text) => {
  return text.startsWith('def ') ||
    text.startsWith('[') ||
    text.match(/^[a-z]+ = /) ||
    (text.match(/^[0-9]/) && text[1] !== '.') ||
    text.match(/^[#{\[\^$%]/) ||
    text.startsWith('http')
};

const run = async () => {
  let i = -1;
  for (const dialog of alpaca_data_cleaned) {
    i++; if (i < _tmp_done.length) continue;

    const { instruction, input, output } = dialog;
    const pre = [];

    pre.push(instruction);

    if (shouldSkip(input) || input.length < 12) {
      pre.push('%%%'); // skip
    } else {
      pre.push(input);
    }

    if (shouldSkip(output)) {
      pre.push('%%%'); // skip
    } else {
      pre.push(output);
    }

    const to_be_trans = pre.join('\n\n###\n\n')
    const res = await translateENtoVI(to_be_trans);
    if (res) {
      const post = res.split('\n\n###\n\n');
      if (post[1].startsWith('%%%')) post[1] = input;
      if (post[2].startsWith('%%%')) post[2] = output;
      const vi_dialog = {
        instruction: post[0],
        input: post[1],
        output: post[2],
      }
      //console.log(to_be_trans, res, vi_dialog);
      console.log(vi_dialog);
      fs.appendFileSync('./_tmp', JSON.stringify(vi_dialog, null, 2) + ',');
    } else {
      console.log("========== ERROR ==========");
      console.log(dialog);
      console.log("===========================");
      fs.appendFileSync('./_tmp', JSON.stringify(dialog, null, 2) + ',');
    }
    //return;
  }
};

run();