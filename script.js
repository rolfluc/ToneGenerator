const AudioContext = window.AudioContext || window.webkitAudioContext;
const baseFrequencyID = "freq_";
const baseOffsetID = "offset_";
const baseDurationID = "duration_";
let audioContext;
let gainNode; 

// TODO kinda brittle. 
let oscillators = [];
let colors = [];
let audioCounter = 0; 

audioContext = new AudioContext();
gainNode = audioContext.createGain();
gainNode.gain.value = 0.15; 
addMoreSources();
updateGraph();


function FinishedFading(box) {
    var genbox = document.getElementById("generatedstring");
    genbox.style.visibility = "hidden";
}

function generateRandomHex() {
    // Generate a random number between 0 and 16777215 (which is FFFFFF in hex)
    const randomNumber = Math.floor(Math.random() * 16777215);
    
    // Convert to hex and ensure it is exactly 6 characters long
    const hexColor = "#" + randomNumber.toString(16).padStart(6, '0');
    
    return hexColor;
}

function showError(string) {
	var genbox = document.getElementById("generatedstring");
	// Append in the event of multiple strings sending down
	if (genbox.style.visibility === "visible") {
		genbox.innerHTML = genbox.innerHTML + string;
	} else {
		if (genbox != null) {
	        genbox.style.visibility = "visible";
	        genbox.style.color = "#ffff00";
	        genbox.style.animation = "";
	        genbox.style.animation = "fadeout 2s";
	        timeoutGenerate = setTimeout(FinishedFading, 1900, genbox);
	        genbox.innerHTML = string;
	    }
	}
}

function addMoreSources() {
	const color = generateRandomHex();
	colors.push(color);
	const newAudioHTML = `
        <div class="audio-group">
            <div>
                <label for="freq_${audioCounter}">Frequency:</label>
                <input type="number" id="freq_${audioCounter}" value="440" min="20" max="20000" class="numeric-only">
            </div>
            <div>
                <label for="offset_${audioCounter}">Offset (ms):</label>
                <input type="number" id="offset_${audioCounter}" value="1000" min="50" max="5000" class="numeric-only">
            </div>
            <div>
                <label for="duration_${audioCounter}">Duration (ms):</label>
                <input type="number" id="duration_${audioCounter}" value="1000" min="50" max="10000" class="numeric-only">
            </div>
            <hr class="separator-line" style="background-color: ${color} !important; border: none !important; height: 2px !important;">
        </div>
    `;

    // 3. Append the new HTML directly to the inside of the scrollbox
    audioBox.insertAdjacentHTML('beforeend', newAudioHTML);

    // 4. Optional UX Touch: Automatically scroll to the bottom so the user sees the new input
    audioBox.scrollTop = audioBox.scrollHeight;
    const oscillator = audioContext.createOscillator(); 
    oscillator.type = 'square';
    oscillator.connect(gainNode).connect(audioContext.destination);
    oscillators.push(oscillator);

    audioCounter++;
}

function stopOscillators() {
	// TODO more, just setting text atm
	document.getElementById('startBtn').textContent = 'Start Audio';
	for (let i = 0; i < audioCounter; i++) { 
		oscillators[i].stop();
		oscillators[i].disconnect();
	}
}

document.getElementById('addNewInput').addEventListener('click', async () => {
	addMoreSources();
	updateGraph();
});

// Start / Stop
document.getElementById('startBtn').addEventListener('click', async () => {
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }

    let maxTime = 0;
    const startTimeNow = audioContext.currentTime;
    // Iterate over all known audios, kicking off the
    if (document.getElementById('startBtn').textContent === 'Start Audio') {
    	for (let i = 0; i < audioCounter; i++) {
    		const duration  = document.getElementById(baseDurationID + i.toString()).value; 
    		const startTime =  document.getElementById(baseOffsetID + i.toString()).value;
    		const oscillator = audioContext.createOscillator(); 
		    oscillator.type = 'square';
		    oscillator.connect(gainNode).connect(audioContext.destination);
		    oscillators[i] = oscillator;
    		oscillators[i].frequency.value = document.getElementById(baseFrequencyID + i.toString()).value;
    		oscillators[i].start(startTimeNow + parseFloat(startTime) / 1000);
    		oscillators[i].stop(startTimeNow + parseFloat(startTime) / 1000 + parseFloat(duration) / 1000);
    		maxTime = Math.max(maxTime,parseFloat(duration)+parseFloat(startTime));
    	}
    	setTimeout(stopOscillators, maxTime)
    	document.getElementById('startBtn').textContent = 'Stop Audio';
    } else {
    	stopOscillators();
    }
});

document.addEventListener('beforeinput', (event) => {
	if (event.target && event.target.classList.contains('numeric-only')) {
		const elementId = event.target.id;
		if (event.data && !/^[0-9]+$/.test(event.data)) {
			event.preventDefault(); // Blocks the character from being typed
		}
		const numericInput = document.getElementById(elementId);

		const currentValue = numericInput.value;
		const targetRanges = event.getTargetRanges();

		let start = currentValue.length;
		let end = currentValue.length;

		if (targetRanges && targetRanges.length > 0) {
			const range = targetRanges[0];
			start = range.startOffset;
			end = range.endOffset;
		} else {
			// Fallback just in case targetRanges isn't supported by an old browser
			start = numericInput.selectionStart ?? currentValue.length;
			end = numericInput.selectionEnd ?? currentValue.length;
		}

		// 3. Predict the future value using the event's ranges
		const predictedValue = 
			currentValue.slice(0, start) + 
			event.data + 
			currentValue.slice(end);

		// 4. Validate
		const predictedNumber = parseInt(predictedValue, 10);

		if (predictedNumber > parseInt(numericInput.max) || predictedNumber < parseInt(numericInput.min)) {
			event.preventDefault(); // Block the input because it would exceed 100
		}
	}
});

function updateGraph() {
	const labelsContainer = document.getElementById('labelsContainer');
	const canvas = document.getElementById('rawCanvas');
	const ctx = canvas.getContext('2d');
	const PADDING_LEFT = 70;   // Space reserved for the left text icon
	const PADDING_RIGHT = 20;
	const PADDING_Y = 10;
	const CANVAS_WIDTH = parseInt(canvas.width); 
	const CANVAS_HEIGHT = parseInt(canvas.height);
	const TICK_COUNT = 21;
	const STEP_X = (CANVAS_WIDTH - PADDING_LEFT - PADDING_RIGHT) / (TICK_COUNT-1);
	ctx.clearRect(0, 0, canvas.width, canvas.height); 
	ctx.strokeStyle = '#e0e0e0'; // Light gray for grid lines
    ctx.lineWidth = 2;
    // 1, it's 768, 2 its 384, ect.
    const SEGMENT_HEIGHT = CANVAS_HEIGHT / audioCounter;

    let earliestTimeMs = 10000;
	let latestTimeMs = 0;
	for (let i = 0; i < audioCounter; i++) {
		const duration  = parseFloat(document.getElementById(baseDurationID + i.toString()).value); 
		const startTime = parseFloat(document.getElementById(baseOffsetID + i.toString()).value);
		earliestTimeMs = Math.min(earliestTimeMs,startTime);
		latestTimeMs = Math.max(latestTimeMs,startTime + duration);
	}
	let ticks = [];
	for (let i = 0; i < TICK_COUNT; i++) {
		ticks.push(i * latestTimeMs / (TICK_COUNT-1));
	}

    // Add the left boundary line
    ctx.beginPath();
    ctx.moveTo(PADDING_LEFT, 0);
    ctx.lineTo(PADDING_LEFT, canvas.height); 
	ctx.stroke();

	// Clear any previous HTML labels before generating new ones
    labelsContainer.innerHTML = '';

    // Create the initial spacer so labels align exactly past the left padding line
    const spacer = document.createElement('div');
    spacer.className = 'axis-spacer';
    spacer.style.width = PADDING_LEFT + 'px';
    labelsContainer.appendChild(spacer);

    ctx.lineWidth = 1;
    for (let i = 0; i <= TICK_COUNT-1; i++) {
        const x = PADDING_LEFT + (i * STEP_X);
        
        // Draw the native canvas tick mark
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT - 6); 
        ctx.stroke();

        // Create the outside-of-canvas HTML text label
        const labelDiv = document.createElement('div');
        labelDiv.className = 'tick-label';
        // Space them apart exactly at our STEP_X interval
        if (i > 0) labelDiv.style.marginLeft = STEP_X + 'px'; 
        
        // TODO migrate this timing over
        labelDiv.innerHTML = `<span>${ticks[i]}</span>`;
        labelsContainer.appendChild(labelDiv);
    }

    const totalScale = ticks[TICK_COUNT - 1] - ticks[0];
	const totalXWorkable = CANVAS_WIDTH - PADDING_LEFT - PADDING_RIGHT;
	const pixelsPerMs = totalXWorkable / totalScale;

	for (let i = 0; i < audioCounter; i++) {
		const frequency = document.getElementById(baseFrequencyID + i.toString()).value;
		const duration  = parseFloat(document.getElementById(baseDurationID + i.toString()).value); 
		const startTime = parseFloat(document.getElementById(baseOffsetID + i.toString()).value);
		const textPosY = (i*SEGMENT_HEIGHT + (i+1)*SEGMENT_HEIGHT) / 2;
		const gridLinesY = [i*SEGMENT_HEIGHT, (i+1)*SEGMENT_HEIGHT];
		// Segmentation Line
		gridLinesY.forEach(y => {
	        ctx.beginPath();
	        ctx.moveTo(0, y); // Start at the edge of the chart area
	        ctx.lineTo(canvas.width, y); // Span to the end of the chart
	        ctx.stroke();
	    });

	    ctx.strokeStyle = '#666';
	    ctx.lineWidth = 1.5;

		ctx.font = "20px Georgia";
		ctx.fillText(frequency.toString(), 5, textPosY);




		// Data points: [X, Y] coordinates
		const points = [
		    { x: PADDING_LEFT + pixelsPerMs * startTime, y: (i+1)*(SEGMENT_HEIGHT) - PADDING_Y},
		    { x: PADDING_LEFT + pixelsPerMs * startTime, y: i*(SEGMENT_HEIGHT) + PADDING_Y},
		    { x: PADDING_LEFT + pixelsPerMs * (startTime + duration), y: i*(SEGMENT_HEIGHT) + PADDING_Y},
		    { x: PADDING_LEFT + pixelsPerMs * (startTime + duration), y: (i+1)*(SEGMENT_HEIGHT) - PADDING_Y},
		];

		// Draw the graph line
		ctx.beginPath();
		ctx.lineWidth = 3;
		ctx.strokeStyle = colors[i];

		// Move to the first data point
		ctx.moveTo(points[0].x, points[0].y);

		// Draw lines connecting the rest of the points
		for (let i = 1; i < points.length; i++) {
		    ctx.lineTo(points[i].x, points[i].y);
		}
		ctx.stroke();

		// Draw dots on top of the coordinates
		ctx.fillStyle = '#333';
		points.forEach(point => {
		    ctx.beginPath();
		    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
		    ctx.fill();
		});
	}
}

// On changes, update the canvas.
document.addEventListener('input', (event) => {
	if (event.target && event.target.classList.contains('numeric-only')) {
		updateGraph();
	}
});

const tabs = document.querySelectorAll('input[name="tabGroup"]');
const selectionDisplay = document.getElementById('selectionDisplay');

tabs.forEach(tab => {
    tab.addEventListener('change', function() {
        
    });
});
