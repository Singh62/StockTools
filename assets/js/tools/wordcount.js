(function () {
  'use strict';
  var WORD = /[\p{L}\p{N}\p{M}]+(?:['’.\-][\p{L}\p{N}\p{M}]+)*/gu; // \p{M}: combining marks keep Hindi/Indic words whole
  function mins(words, wpm) {
    var s = Math.round(words / wpm * 60);
    if (s < 60) return s + ' sec';
    var m = Math.floor(s / 60), r = s % 60; return m + ' min' + (r ? ' ' + r + ' sec' : '');
  }
  function stats(text) {
    var words = (text.match(WORD) || []).length;
    return {
      words: words,
      characters: Array.from(text).length,
      charactersNoSpaces: Array.from(text.replace(/\s/g, '')).length,
      sentences: text.split(/[.!?]+(?=\s|$)/).filter(function (s) { return /[\p{L}\p{N}]/u.test(s); }).length,
      paragraphs: text.split(/\n\s*\n/).filter(function (s) { return s.trim(); }).length,
      readingTime: mins(words, 200),
      speakingTime: mins(words, 130)
    };
  }
  var api = { stats: stats };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }

  document.addEventListener('DOMContentLoaded', function () {
    var S = window.ST, inp = document.getElementById('input'), lim = document.getElementById('limit'), note = document.getElementById('limit-note'), t;
    var ids = { words: 'c-words', characters: 'c-chars', charactersNoSpaces: 'c-nospace', sentences: 'c-sent', paragraphs: 'c-para', readingTime: 'c-read', speakingTime: 'c-speak' };
    function update() {
      var s = stats(inp.value);
      Object.keys(ids).forEach(function (k) { document.getElementById(ids[k]).textContent = typeof s[k] === 'number' ? S.fmtNum(s[k], 0) : s[k]; });
      var L = S.parseNumber(lim.value);
      if (lim.value && (!(L > 0))) note.textContent = 'Enter a limit greater than 0, or leave it empty.';
      else if (L > 0) { var left = L - s.characters; note.textContent = left >= 0 ? S.fmtNum(left, 0) + ' characters remaining' : S.fmtNum(-left, 0) + ' characters over the limit'; note.classList.toggle('over', left < 0); }
      else note.textContent = '';
    }
    inp.addEventListener('input', function () { S.trackUse(); clearTimeout(t); t = setTimeout(update, 60); });
    lim.addEventListener('input', update);
    document.getElementById('btn-reset').addEventListener('click', function () { inp.value = ''; lim.value = ''; update(); inp.focus(); });
    document.getElementById('copy-btn').addEventListener('click', function () {
      var s = stats(inp.value); S.copyText('Words: ' + s.words + '\nCharacters: ' + s.characters + ' (' + s.charactersNoSpaces + ' without spaces)\nSentences: ' + s.sentences + '\nParagraphs: ' + s.paragraphs + '\nReading time: ' + s.readingTime, this);
    });
    update();
  });
})();
