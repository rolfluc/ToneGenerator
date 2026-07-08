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
let monoSignal = null;
let sampleRate = 0;

audioContext = new AudioContext();
gainNode = audioContext.createGain();
gainNode.gain.value = 0.15; 
addMoreSources();
updateGraph();

ToneCreatorTabNumber = "Tab 1"
SoundDeconstructorTabNumber = "Tab 2"

const tabNames = [ToneCreatorTabNumber, SoundDeconstructorTabNumber];

// Clear the input value
document.getElementById("audioFile").value = "";
document.getElementById("defTab").checked = true;
setEnabledStatuses(ToneCreatorTabNumber);

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

function clearCanvas() {
	const labelsContainer = document.getElementById('labelsContainer');
	const canvas = document.getElementById('rawCanvas');
	const ctx = canvas.getContext('2d');
	ctx.clearRect(0, 0, canvas.width, canvas.height); 
	labelsContainer.innerHTML = '';
}

function clearAudioSources() {
	audioBox.innerHTML = '';
	audioCounter = 0;
	oscillators = [];
	colors = [];
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

function setStatusForClass(targetClass, disabledStatus) {
    const selector = `[class="${targetClass}"]`;
    const controls = document.querySelectorAll(selector);
    controls.forEach(item => {
        item.disabled = disabledStatus;
    });
}

function setEnabledStatuses(enableClass) {
    for (let i = 0; i < tabNames.length; i++) {
        // Disables the class if it's NOT the enabled one, enables it if it is
        setStatusForClass(tabNames[i], tabNames[i] != enableClass);
    }
}

const tabs = document.querySelectorAll('input[name="tabGroup"]');

tabs.forEach(tab => {
    tab.addEventListener('change', function() {
        console.log(`Active Tab: ${this.value}`);
        if (this.value == ToneCreatorTabNumber) {
            setEnabledStatuses(this.value);
            addMoreSources();
            updateGraph();
        } else if (this.value == SoundDeconstructorTabNumber) {
            setEnabledStatuses(this.value);
            clearCanvas();
            clearAudioSources();
            monoSignal = null;
        }
    });
});

function computeFFT(realInput) {
  const N = realInput.length;
  const real = new Float32Array(realInput); // clone to avoid mutation
  const imag = new Float32Array(N);
  
  // 1. Bit-reversal permutation
  let i = 0;
  for (let j = 1; j < N - 1; j++) {
    let bit = N >> 1;
    while (i >= bit) { i -= bit; bit >>= 1; }
    i += bit;
    if (j < i) {
      let t = real[j]; real[j] = real[i]; real[i] = t;
      t = imag[j]; imag[j] = imag[i]; imag[i] = t;
    }
  }
  
  // 2. Cooley-Tukey Decimation-in-Time
  for (let len = 2; len <= N; len <<= 1) {
    let ang = (2 * Math.PI / len) * -1;
    let wlen_re = Math.cos(ang);
    let wlen_im = Math.sin(ang);
    for (let i = 0; i < N; i += len) {
      let w_re = 1, w_im = 0;
      for (let j = 0; j < len / 2; j++) {
        let u_re = real[i + j], u_im = imag[i + j];
        let idx = i + j + len / 2;
        let v_re = real[idx] * w_re - imag[idx] * w_im;
        let v_im = real[idx] * w_im + imag[idx] * w_re;
        
        real[i + j] = u_re + v_re;
        imag[i + j] = u_im + v_im;
        real[idx] = u_re - v_re;
        imag[idx] = u_im - v_im;
        
        let next_w_re = w_re * wlen_re - w_im * wlen_im;
        w_im = w_re * wlen_im + w_im * wlen_re;
        w_re = next_w_re;
      }
    }
  }
  
  // 3. Compute absolute magnitudes for the real half (Nyquist limit)
  const magnitudes = new Float32Array(N / 2);
  for (let k = 0; k < N / 2; k++) {
    magnitudes[k] = Math.sqrt(real[k] * real[k] + imag[k] * imag[k]);
  }
  return magnitudes;
}

function getStrongestFrequencies(magnitudes, sample, N, topK = 5) {
  // Create objects containing the frequency mapping and magnitude
  const bins = Array.from(magnitudes).map((mag, index) => ({
    frequency: (index * sample) / N,
    magnitude: mag
  }));

  // Sort by magnitude descending
  bins.sort((a, b) => b.magnitude - a.magnitude);

  // Return the top strongest components
  return bins.slice(0, topK);
}

function downmixToMono(audioBuffer) {
  const totalSamples = audioBuffer.length;
  const left = audioBuffer.getChannelData(0);
  const isStereo = audioBuffer.numberOfChannels > 1;
  
  const mono = new Float32Array(totalSamples);
  
  if (isStereo) {
    const right = audioBuffer.getChannelData(1);
    for (let i = 0; i < totalSamples; i++) {
      // Average the two channels together
      mono[i] = (left[i] + right[i]) / 2;
    }
  } else {
    // If it's already mono, just copy the data
    mono.set(left);
  }
  
  return mono;
}

document.getElementById('audioFile').addEventListener('change', async (event) => {
	const file = event.target.files[0];
	if (!file) return; // User canceled selection
	try {
		/*
		// FFT:
	    const arrayBuffer = await file.arrayBuffer();
	    
	    // 2. Initialize your AudioContext and decode the raw data
	    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
	    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
	    
	    const channelData = audioBuffer.getChannelData(0); // Left/Mono channel
	    const sampleRate = audioBuffer.sampleRate;
	    
	    // 3. Pick your window size and extract the samples
	    const N = 2048; 
	    const sampleChunk = channelData.slice(0, N);
	    
	    // 4. Run the math functions we created earlier
	    const magnitudes = computeFFT(sampleChunk);
	    const topPeaks = getStrongestFrequencies(magnitudes, sampleRate, N, 5); 

	    // 5. Output your results
	    displayResults(topPeaks);
	    */
		const arrayBuffer = await file.arrayBuffer();
	    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
	    
	    sampleRate = audioBuffer.sampleRate;
	    monoSignal = downmixToMono(audioBuffer);
	    const canvas = document.getElementById('rawCanvas');
    
	    // 3. Process data points down to fit the canvas width
	    const plotData = generatePlotData(monoSignal, canvas.width);
	    
	    // 4. Draw it!
	    drawWaveform(plotData, canvas);
	} 
	catch (error) {
    	console.error("Error decoding or processing the WAV file:", error);
	    alert("Could not process this file. Make sure it is a valid uncompressed WAV file.");
	}
});

// Simple UI helper to log out the frequencies nicely
function displayResults(peaks) {
	console.log("Top Peaks Found:", peaks);
	// Example: display "Hz" cleanly to the user
	peaks.forEach((peak, i) => {
		console.log(`Rank ${i+1}: ${peak.frequency.toFixed(1)} Hz (Magnitude: ${peak.magnitude.toFixed(2)})`);
	});
}

function playMonoSignal(signal, sample) {
  // 2. Create an empty audio buffer block (1 channel, matching your exact sample count)
  const playbackBuffer = audioContext.createBuffer(1, signal.length, sample);

  // 3. Copy our downmixed mono data directly into channel 0 (the only channel)
  playbackBuffer.copyToChannel(signal, 0);

  // 4. Create a virtual playback node
  const sourceNode = audioContext.createBufferSource();
  sourceNode.buffer = playbackBuffer;

  // 5. Connect the node to your speakers and play it!
  sourceNode.connect(audioContext.destination);
  sourceNode.start(0);

  // Save the node reference so you can trigger a stop button later
  currentAudioSource = sourceNode; 
}

document.getElementById('playMono').addEventListener('click', async () => {
	if (monoSignal == null) {
		return;
	}
	playMonoSignal(monoSignal,sampleRate);
});

function generatePlotData(monoSignal, targetWidth) {
  const plotData = new Float32Array(targetWidth);
  const blockSize = Math.floor(monoSignal.length / targetWidth);

  for (let i = 0; i < targetWidth; i++) {
    const start = i * blockSize;
    const end = start + blockSize;
    
    let maxAmp = 0;
    // Find the absolute peak amplitude within this pixel's block of data
    for (let j = start; j < end; j++) {
      const val = Math.abs(monoSignal[j]);
      if (val > maxAmp) {
        maxAmp = val;
      }
    }
    plotData[i] = maxAmp; // Store values ranging 0.0 to 1.0
  }
  
  return plotData;
}

/**
 * Renders the amplitude stream symmetrically onto a canvas context
 */
function drawWaveform(amplitudes, canvas) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const centerY = height / 2;

  // Clear previous drawings
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#10b981'; // Waveform color (Emerald green)

  // Draw each data point as a vertical bar
  for (let x = 0; x < width; x++) {
    const amplitude = amplitudes[x];
    const barHeight = amplitude * centerY; // Scale to fit half-height of canvas

    // Draw symmetrically up and down from the center line
    ctx.fillRect(x, centerY - barHeight, 1, barHeight * 2);
  }
}


document.getElementById('playSample').addEventListener('click', async () => {

});


