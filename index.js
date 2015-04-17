
module.exports = justify;

function justify(elements, options) {
  // build the options
  options = options || {};
  options.rowWidth = Math.round(Math.max(1, options.rowWidth || 800));
  options.rowHeight = Math.round(Math.max(1, options.rowHeight || 100));
  options.heightThreshold = Math.min(1, Math.max(0, options.heightThreshold || 0.10)); // 10%
  options.orphanThreshold = Math.min(1, Math.max(0, options.orphanThreshold || 0.25)); // 25%

  // build some easier to use entry objects
  var entries = [];
  for(var i=0; i < elements.length; i++) {
    entries.push({
      row: null,
      element: elements[i],
      aspectRatio: aspectRatio(elements[i]),
      height: function() {
        return this.row && this.row.height || options.rowHeight;
      },
      width: function() {
        // console.log('entry.width(h: %s, r: %s)', this.height(), this.aspectRatio);
        return this.height() * this.aspectRatio;
      }
    });
  }

  // build rows
  console.log('build rows')
  var rows = [];
  var row = makeRow(rows, null, options.rowHeight);
  var contentWidth = 0;
  var contentHeight = options.rowHeight;
  entries.forEach(function buildRows(entry) {
    contentWidth += entry.width();
    entry.row = row;
    row.entries.push(entry);
    console.log(' - %s,%s %sx%s', rows.length, row.entries.length, entry.width(), entry.height());

    // when overflowing make sure the row fits
    if (contentWidth >= options.rowWidth) {
      var removedEntries = [];
      console.log(' - overflowing: %s / %s', contentWidth, options.rowWidth);

      contentHeight = options.rowHeight / contentWidth * options.rowWidth;
      contentWidth = options.rowWidth;
      console.log(' - row: %sx%s', contentWidth, contentHeight);

      // if it's not within the threshold try with one less entry
      var diffHeight = Math.abs(options.rowHeight - contentHeight);
      while (row.entries.length > 1 && diffHeight >= options.rowHeight*options.heightThreshold) {
        console.log(' - over threshold. pop and resize %s > %s.', diffHeight, options.rowHeight*options.heightThreshold);
        var removedEntry = row.entries.pop();
        contentWidth = row.width();
        contentHeight = options.rowHeight / contentWidth * options.rowWidth;
        row.height = contentHeight;
        contentWidth = row.width();
        console.log(' - justified height: %s / %s * %s = %s', options.rowHeight, contentWidth, options.rowWidth, contentHeight)
        console.log(' - updated row: %sx%s', contentWidth, contentHeight);
        removedEntries.push(removedEntry);
        diffHeight = Math.abs(options.rowHeight - contentHeight);
      }

      if (diffHeight > options.rowHeight*options.heightThreshold) {
        console.log(' - STILL over threshold. pop and resize %s > %s.', diffHeight, options.rowHeight*options.heightThreshold);
        console.log('   entries left in row: %s', row.entries.length);
        if (row.entries.length === 1) {
          // TODO only one entry left and it's aspect ratio won't let it
          // justify within the threshold. how to deal with these?
          console.log('  ONLY one entry left. it won\'t fit so we\'ll ignore threshold');
          row.height = entry.height();
        }
      }

      // done, reset and start a new row
      row.height = contentHeight;
      row = makeRow(rows, removedEntries, options.rowHeight);
      removedEntries.forEach(function(entry) {
        entry.row = row;
      });

      contentWidth = row.width();
      contentHeight = options.rowHeight;
    }
  });


  // deal with the last row, if there are entries in it
  if (row.entries.length) {
    row.height = contentHeight;

    // justify the last row if it's width is within a threshold
    var diffWidth = Math.abs(options.rowWidth - contentWidth);
    console.log('last row. should we justify?', diffWidth, options.rowWidth*options.orphanThreshold);
    if (diffWidth <= options.rowWidth*options.orphanThreshold) {
      console.log('justify last row. %s > %s', diffWidth, options.rowWidth*options.orphanThreshold, contentWidth);
      contentHeight = options.rowHeight / row.width() * options.rowWidth;
      row.height = contentHeight;
      console.log(' - updated row: %sx%s', row.width(), contentHeight);
    }
  }

  // update the elements
  console.log('render elements:')
  var x = 0;
  var y = 0;
  rows.forEach(function renderRow(row) {
    row.entries.forEach(function renderEntry(entry) {
      console.log(' - entry at %s,%s %sx%s', x|0, y|0, entry.width(), entry.height()|0);
      entry.element.style.left = Math.floor(x) + 'px';
      entry.element.style.top = Math.floor(y) + 'px';
      entry.element.style.width = Math.min(options.rowWidth, Math.ceil(entry.width())) + 'px';
      entry.element.style.height = Math.ceil(entry.height()) + 'px';
      entry.element.style.position = 'absolute';
      x += entry.width();
    });
    console.log(' - row at %sx%s', row.width()|0, row.height|0);
    x = 0;
    y += row.height;
  });
}

function makeRow(rows, initialEntries, initialHeight) {
  var row = {
    entries: initialEntries ? initialEntries : [],
    height: initialHeight,
    width: function() {
      return this.entries.reduce(function(t,e) {
        return t + e.width();
      }, 0);
    }
  };
  rows.push(row);
  console.log('makeRow()');
  return row;
}

function aspectRatio(element) {
  var r = parseFloat(element.dataset.aspectRatio, 10) || 0;
  if (r) {
    return r;
  } else {
    var w = parseFloat(element.dataset.width || element.naturalWidth || element.getAttribute('width') || element.width, 10) || 1;
    var h = parseFloat(element.dataset.height || element.naturalHeight || element.getAttribute('height') || element.height, 10) || 1;
    return w / h;
  }
}
