class Gauge {
    constructor(container, options) {
        this.container = container;
        this.#setHTML();

        this.min = options.min;
        this.max = options.max;
        this.range = Math.abs(this.max - this.min);
        this.currentValue = options.value;

        this.#drawValues(options.values);
        this.#drawMajorTicks(options.majorTicks);
        this.#drawMinorTicks(options.minorTicks);
        options.segments.forEach(segment => {
            this.#addSegment(segment.start, segment.end, segment.type);
        })
        this.#setLabelText(options.label);
        this.value = options.value;
    }


    #setHTML() {
        this.container.innerHTML = /*html*/`
            <div class="svg-gauge">
                <!-- r = 100 / 2pi -->
                <svg width="100%" height="100%" viewBox="0 0 40 40">
                    
                    <!-- Gauge boundary -->
                    <circle class="gauge-boundary" cx="20" cy="20" r="19" fill="transparent"></circle>
                    
                    <!-- Gauge track-->
                    <circle class="gauge-hole" cx="20" cy="20" r="15.91549430918954" fill="#fff"></circle>
                    <circle class="gauge-ring" cx="20" cy="20" r="15.91549430918954" fill="transparent" stroke-width="3.5"></circle>

                    <!-- Major ticks -->
                    <circle class="gauge-major-ticks" cx="20" cy="20" r="15.91549430918954" fill="transparent" 
                        stroke-width="3.5" stroke-dashoffset="-12.5"></circle>

                    <!-- White base segment -->
                    <circle class="gauge-segment gauge-segment-base" cx="20" cy="20" r="15.91549430918954" fill="transparent" 
                    stroke-width="3.5" stroke-dasharray="25 75" stroke-dashoffset="-12.5"></circle>
                
                    <!-- Text -->
                    <text class="gauge-text" y="60%" transform="translate(0, 2)" style="display:none">
                        <tspan x="50%" class="gauge-label"></tspan>   
                    </text>
                    
                    <!-- Needle -->
                    <line class="gauge-needle" x1="20" y1="20" x2="20" y2="4.08450569081046" />
                    <circle class="gauge-centre" cx="20" cy="20" r="1.5" fill="#eee" stroke="#ccc" stroke-width="0.1"></circle>
                </svg>
            </div>
        `
    }

    #addSegment(start, end, segmentType) {
        const startPercent = ((start - this.min) / this.range) * 100;
        const endPercent = ((end - this.min) / this.range) * 100;;
        const percent = endPercent - startPercent;
        const p = percent * 0.75;
        const s = startPercent * 0.75;
        const dashOffset = 62.5 - s;
        const dashArray = `${p} ${100-p}`;
    
        const gauge = this.container.querySelector(".svg-gauge > svg");
        const gaugeMajorTicks = this.container.querySelector(".svg-gauge .gauge-major-ticks");
        
        const segment = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        segment.classList.add(`gauge-segment-${segmentType}`);
        segment.setAttribute("cx", 20);
        segment.setAttribute("cy", 20);
        segment.setAttribute("r", 15.91549430918954);
        segment.setAttribute("fill", "transparent");
        gauge.insertBefore(segment, gaugeMajorTicks);
    
        segment.setAttribute("stroke-dashoffset", dashOffset);
        segment.setAttribute("stroke-dasharray", dashArray);
    }
    
    set value(newValue) {
        this.currentValue = this.#clamp(newValue);
        const angle = (((this.currentValue - this.min) / this.range) * 270) - 135;
        const needle = this.container.querySelector(".gauge-needle");
        needle.style.transform = `rotate(${angle}deg)`;
    }

    get value() {
        return this.currentValue;
    }
    
    #setLabelText(labelText) {
        this.container.querySelector(".gauge-label").innerHTML = labelText;
        this.container.querySelector(".gauge-text").style.display = "unset";
    }
    
    #drawValues(values) {
        const count = values.length;
        if (count == 0)
            return;

        const multiplier = 75 / this.range;
    
        values.splice(0, 0, this.min);
    
        let angle = 0;
        for (let i = 1; i < values.length; i++) {
            this.#checkWithinRange(values[i]);
            const segmentSize = values[i] - values[i - 1];
    
            angle += ((segmentSize * multiplier) / 100) * 2 * Math.PI;
            const rotatedAngle = (angle + (0.75 * Math.PI)); // 0 degrees points East, so rotate by 135 degrees to start of gauge
            let textPos = null;
            let radius = 0;
            if (rotatedAngle < this.#degreesToRadians(225)) {
                textPos = "left";
                radius = 13;
            } else if (rotatedAngle >= this.#degreesToRadians(225) && rotatedAngle < this.#degreesToRadians(315)) {
                textPos = "top";
                radius = 12;
            } else if (rotatedAngle >= this.#degreesToRadians(315)) {
                textPos = "right";
                radius = 13;
            }
    
            const tickX = radius * Math.cos(rotatedAngle); // x = r * cos(theta);
            const tickY = radius * Math.sin(rotatedAngle); // y = r * sin(theta);
            //this.#drawCircle(tickX + 20, tickY + 20, 0.1);
            this.#drawText(tickX + 20, tickY + 20, values[i], textPos);
        }
    }
    
    #drawMajorTicks(values) {
        const count = values.length;
        if (count == 0)
            return;
    
        const multiplier = 75 / this.range;
    
        if (values[0] != this.min)
            values.splice(0, 0, this.min);
    
        let angle = 0;
        const segmentSizes = [];
        const tickWidth = 0.4;
        for (let i = 1; i < values.length; i++) {
            this.#checkWithinRange(values[i]);
            const segmentSize = values[i] - values[i - 1];
            const segmentDashArraySize = (segmentSize * multiplier) - (i == 1 ? tickWidth / 2 : tickWidth);
            segmentSizes.push(segmentDashArraySize);
            if (i < values.length - 1) {
                segmentSizes.push(tickWidth); // Tick
            }
        }
    
        // 25, then remainder makes up 75
        const dashArray = `25 ${segmentSizes.join(" ")}`;
        const dashOffset = 0;
    
        var tickRing = this.container.querySelector(".gauge-major-ticks");
        //tickRing.setAttribute("stroke-dashoffset", dashOffset);
        tickRing.setAttribute("stroke-dasharray", dashArray);
    }
    
    #drawMinorTicks(values) {
        const count = values.length;
        const multiplier = 75 / this.range;
    
        const gauge = this.container.querySelector(".svg-gauge > svg");
        const gaugeNeedle = this.container.querySelector(".svg-gauge .gauge-needle");
    
        values.splice(0, 0, this.min);

        let angle = 0;
        for (let i = 1; i < values.length; i++) {
            this.#checkWithinRange(values[i]);
            const segmentSize = values[i] - values[i - 1];
            angle += ((segmentSize * multiplier) / 100) * 2 * Math.PI;
            const rotatedAngle = (angle + (0.75 * Math.PI)); // 0 degrees points East, so rotate by 135 degrees to start of gauge
            const startTickX = 17.6 * Math.cos(rotatedAngle);
            const startTickY = 17.6 * Math.sin(rotatedAngle);
            const endTickX = 16.9 * Math.cos(rotatedAngle);
            const endTickY = 16.9 * Math.sin(rotatedAngle);
            const lineElem = document.createElementNS("http://www.w3.org/2000/svg", "line");
            lineElem.classList.add("gauge-minor-tick");
            lineElem.setAttribute("x1", startTickX + 20);
            lineElem.setAttribute("y1", startTickY + 20);
            lineElem.setAttribute("x2", endTickX + 20);
            lineElem.setAttribute("y2", endTickY + 20);
            gauge.insertBefore(lineElem, gaugeNeedle);
        }
    }
    
    #checkWithinRange(value) {
        if (value < this.min || value > this.max)
            throw new Error(`Value '${value}' is outside the valid range of the gauge (${min} to ${max}).`);
    }
    
    #clamp(value) {
        return Math.min(Math.max(value, this.min), this.max);
    }
    
    #degreesToRadians(degrees) {
        return (degrees / 360) * 2 * Math.PI;
    }
    
    #radiansToDegrees(radians) {
        return (radians / (2 * Math.PI)) * 360;
    }
    
    #drawCircle(x, y, r) {
        const gauge = this.container.querySelector(".svg-gauge > svg");
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", y);
        circle.setAttribute("r", r);
        circle.setAttribute("fill", "red");
        gauge.appendChild(circle);
    }
    
    #drawText(x, y, text, textPos) {
        const gauge = this.container.querySelector(".svg-gauge > svg");
        const gaugeNeedle = this.container.querySelector(".svg-gauge .gauge-needle");
        const textElem = document.createElementNS("http://www.w3.org/2000/svg", "text");
        textElem.classList.add("gauge-value-label");
        if (textPos == "left")
            textElem.classList.add("gauge-value-label-left");
        else if (textPos == "top")
            textElem.classList.add("gauge-value-label-top");
        else if (textPos == "right")
            textElem.classList.add("gauge-value-label-right");
    
        textElem.setAttribute("x", x);
        textElem.setAttribute("y", y);
        textElem.innerHTML = text;
        gauge.insertBefore(textElem, gaugeNeedle);
    }
}