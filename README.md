# justified-grid

Justify elements to fit a certain width. Just like Flickr does.

It does not actually render the grid to the DOM but instead it lets you provide
a render callback or get a list of positions and sizes to apply to the elements.

## Example

[./examples/basic.html](Just a basic example:)

```
var elements = [
  {id: 1, width: 100, height: 80},
  {id: 2, width: 80, height: 100},
];

var grid = justifyGrid(elements);

grid.elements.forEach(function(entry) {
  // entry: {x: <x>, y: <y>, w: <width>, h: <height>, element: {...}};
});
```

## CDN

To use this lib standalone without compiling you can use [wzrd.in](https://wzrd.in/).

And thus simply:

```
<script src='https://wzrd.in/standalone/justified-grid@1.0'></script>
<script>
var grid = justifiedGrid([elements...]);
</script>
```
