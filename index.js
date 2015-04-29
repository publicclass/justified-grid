
module.exports = justify;

function justify(elements, options) {
  // build the options
  options = options || {};
  options.debug = !!options.debug;
  options.padding = Math.round(options.padding*2 || 0);
  options.rowWidth = Math.round(Math.max(1, options.rowWidth || 800));
  options.rowHeight = Math.round(Math.max(1, options.rowHeight || 100)) - options.padding;
  options.heightThreshold = Math.min(1, Math.max(0, options.heightThreshold || 0.25)); // 25%
  options.orphanThreshold = Math.min(1, Math.max(0, options.orphanThreshold || 0.25)); // 25%
  options.render = typeof options.render == 'function' ? options.render : false;

  // build some easier to use entry objects
  var entries = [];
  for(var i=0; i < elements.length; i++) {
    entries.push({
      row: null,
      element: elements[i],
      aspectRatio: aspectRatio(elements[i]),
      height: function() {
        // log('entry.height(%s || %s)', this.row && this.row.height, options.rowHeight);
        return this.row && this.row.height || options.rowHeight;
      },
      width: function() {
        // log('entry.width(h: %s, r: %s)', this.height(), this.aspectRatio);
        return this.height() * this.aspectRatio;
      }
    });
  }

  var log = options.debug ? console.log.bind(console) : function(){};

  // build rows
  log('build rows');

  var rows = [];
  var row = makeRow(rows, null, options.rowHeight);
  var contentWidth = 0;
  var contentHeight = options.rowHeight;
  entries.forEach(function buildRows(entry) {
    contentWidth += entry.width();
    entry.row = row;
    row.entries.push(entry);

    log(' - %s,%s %sx%s', rows.length, row.entries.length, entry.width(), entry.height());

    //If padding exists make remove it from the content sizes.
    var totalRowPadding = options.padding > 0 ? (row.entries.length)*(options.padding) : 0;
    // when overflowing make sure the row fits
    if (contentWidth >= options.rowWidth-totalRowPadding) {
      var removedEntries = [];

      log(' - overflowing: %s / %s', contentWidth, options.rowWidth);
      contentHeight = options.rowHeight / (contentWidth) * (options.rowWidth-totalRowPadding);
      contentWidth = options.rowWidth - totalRowPadding;
      log(' - row: %sx%s', contentWidth, contentHeight);

      // if it's not within the threshold try with one less entry
      while (row.entries.length > 1 && Math.abs(options.rowHeight - contentHeight) >= options.rowHeight*options.heightThreshold) {
        log(' - over threshold. pop and resize.');
        var preDiff = Math.abs(options.rowHeight - contentHeight);
        var removedEntry = row.entries.pop();
        contentWidth = row.width();
        contentHeight = options.rowHeight / contentWidth * (options.rowWidth-totalRowPadding);
        row.height = contentHeight;
        contentWidth = row.width();
        var postDiff = Math.abs(options.rowHeight - contentHeight);
        log(' - justified height: %s / %s * %s = %s', options.rowHeight, contentWidth, options.rowWidth, contentHeight)
        log(' - updated row: %sx%s (%s vs %s)', contentWidth, contentHeight, preDiff, postDiff);

        // TODO check if we we're better off with that last entry anyway

        removedEntries.push(removedEntry);
      }

      if (Math.abs(options.rowHeight - contentHeight) > options.rowHeight*options.heightThreshold) {
        log(' - STILL over threshold. entries left in row: %s', row.entries.length);
        if (row.entries.length === 1) {
          // TODO only one entry left and it's aspect ratio won't let it
          // justify within the threshold. how to deal with these?
          log('  ONLY one entry left. it won\'t fit so we\'ll ignore threshold');
          var lastEntry = row.entries[0];
          contentHeight = 1/lastEntry.aspectRatio * options.rowWidth;
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
    log('last row. should we justify?', diffWidth, options.rowWidth*options.orphanThreshold);
    if (diffWidth <= options.rowWidth*options.orphanThreshold) {
      log('justify last row. %s > %s', diffWidth, options.rowWidth*options.orphanThreshold, contentWidth);
      contentHeight = options.rowHeight / row.width() * options.rowWidth;
      row.height = contentHeight;
      log(' - updated row: %sx%s', row.width(), contentHeight);
    }
  }

  // update the elements
  log('render elements:')
  var x = 0;
  var y = 0;
  var elements = [];
  rows.forEach(function renderRow(row) {
    row.entries.forEach(function renderEntry(entry) {
      log(' - entry at %s,%s %sx%s', x|0, y|0, entry.width(), entry.height()|0);
      var w = entry.width() + (options.padding);
      var h = entry.height() + (options.padding);
      var e = {
        x: Math.floor(x),
        y: Math.floor(y),
        w: Math.min(options.rowWidth, Math.ceil(w)),
        h: Math.ceil(h),
        element: entry.element
      };
      if (options.render) {
        options.render(e);
      } else {
        elements.push(e);
      }
      x += w;
    });
    log(' - row at %sx%s', row.width()|0, row.height|0);
    x = 0;
    y += row.height + (options.padding);
  });

  return {
    // grid properties
    width: options.rowWidth,
    height: y,
    elements: elements
  };
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
  return row;
}

function aspectRatio(element) {
  var r = parseFloat(getAxis(element, 'aspectRatio'), 10) || 0;
  if (r) {
    return r;
  } else {
    var w = parseFloat(getAxis(element, 'width'), 10) || 1;
    var h = parseFloat(getAxis(element, 'height'), 10) || 1;
    console.log('aspectRatio: w:%s h:%s', w, h);
    return w / h;
  }
}

var AxisMap = {width: 'naturalWidth', height: 'naturalHeight'};

function getAxis(element, axis) {
  var Axis = AxisMap[axis];
  if (element.dataset && element.dataset[axis]) {
    return element.dataset[axis];
  } else if (element[Axis]) {
    return element[Axis];
  } else if (element.getAttribute && element.getAttribute(axis)) {
    return element.getAttribute(axis);
  }
  return element[axis];
}