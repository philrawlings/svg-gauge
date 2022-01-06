# SVG Gauge
Responsive SVG Gauge implemented in JavaScript and stylable with CSS

![Example Gauge](https://github.com/philrawlings/svg-gauge/blob/main/example.png?raw=true)

## Usage

Add stylesheet to head:

```html
<link rel="stylesheet" href="/gauge.css">
```

Add Script at bottom of page (if referencing after page content loaded, see gauge-test.htm as an example):

```html
<script src="/gauge.js"></script>
```

Create the gauge:

```javascript
const gaugeContainer = document.querySelector("#gauge-container");
const gauge = new Gauge(gaugeContainer, {
    min: -500,
    max: 500,
    values: [-500, -400, -300, -200, -100, 0, 100, 200, 300, 400, 500],
    majorTicks: [-500, -450, -400, -350, -300, -250, -200, -150, -100, -50, 0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500],
    minorTicks: [-475, -425, -375, -325, -275, -225, -175, -125, -75, -25, 25, 75, 125, 175, 225, 275, 325, 375, 425, 475],
    segments: [
        { start: -500, end: -400, type: "red" },
        { start: -400, end: -300, type: "yellow" },
        { start: -300, end: 300, type: "green" },
        { start: 300, end: 400, type: "yellow" },
        { start: 400, end: 500, type: "red" }
    ],
    label: "mmHg",
    value: 0
});
```

Add handler code to modify the value. For example:

```javascript
document.querySelector("#gauge-value").addEventListener("change", event => {
    gauge.value = event.currentTarget.value;
});
``` 


