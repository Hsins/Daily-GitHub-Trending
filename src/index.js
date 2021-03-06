const path = require('path');
const axios = require('axios');
const moment = require('moment');
const cheerio = require('cheerio');
const { writeFileSync, mkdirSync } = require('fs');

// variable declaration
const url = 'https://github.com/';
const date = moment().endOf('day');
const filePath = `../data/${date.format('YYYY')}/${date.format('MM')}/`;

const instance = axios.create({
  baseURL: url,
  headers: {
    'Host': 'github.com',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.106 Safari/537.36',
    'Accept': '*/*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  }
});

const getData = async () => {
  const { data } = await instance.get('/trending');
  const $ = cheerio.load(data);
  const arr = [];

  // Retrieve the repositories from responsed data.
  $('.Box-row').each((i, elm) => {
    const item = {
      title: $(elm).find('h1').text().replace(/\s/g, ''),
      url: `https://github.com${$(elm).find('h1 a').attr('href')}`,
      description: $(elm).find('p').text().replace(/\n/g, '').trim(),
      language: $(elm).find('[itemprop="programmingLanguage"]').text() || 'none',
      star: $(elm).find('span').last().text().match(/\d+/g)[0]
    };
    arr.push(item);
  });

  return arr;
};

const saveFile = async data => {
  // create folder for files
  await mkdirSync(
    path.resolve(__dirname, filePath),
    { recursive: true },
    err => {
      if (err) throw err;
    }
  );

  // save data in JSON format
  await writeFileSync(
    path.resolve(__dirname, filePath, `${date.format('YYYY-MM-DD')}.json`),
    JSON.stringify(data, null, 2),
    'utf-8'
  );

  // save data in MarkDown format
  const md = [
    `# GitHub Trending (${date.format('YYYY-MM-DD')})`,
    '',
    ...data.map(
      ({ title, url, description, language, star }) =>
        `![](https://img.shields.io/badge/${encodeURIComponent(
          language
        )}-New%20${star}-green?style=flat-square&logo=appveyor)\n- [${title}](${url}): ${description}\n`
    ),
    ''
  ];

  await writeFileSync(
    path.resolve(__dirname, filePath, `${date.format('YYYY-MM-DD')}.md`),
    md.join('\n'),
    'utf-8'
  );
};

(async () => {
  let data = await getData();
  await saveFile(data);
})();
