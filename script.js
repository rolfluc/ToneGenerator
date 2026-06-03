const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioContext;
let oscillator; // Will hold our sine wave generator
let gainNode; // Will control volume

function FinishedFading(box) {
    var genbox = document.getElementById("generatedstring");
    genbox.style.visibility = "hidden";
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

function startAudio() {
    // Start audio: create oscillator and gain node
    oscillator = audioContext.createOscillator();
    oscillator.type = 'square';
    oscillator.frequency.value = document.getElementById('freq').value; // Sync with box

    gainNode = audioContext.createGain();
    gainNode.gain.value = 0.15; 

    oscillator.connect(gainNode).connect(audioContext.destination);
    oscillator.start();

    setTimeout(stopAudio,document.getElementById('duration').value);

    document.getElementById('startBtn').textContent = 'Stop Audio';
}

function stopAudio() {
	oscillator.stop();
    oscillator.disconnect();
    gainNode.disconnect();

    document.getElementById('startBtn').textContent = 'Start Audio';
}

// Start / Stop
document.getElementById('startBtn').addEventListener('click', async () => {
    if (!audioContext) {
        audioContext = new AudioContext();
    }
 
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }

    if (document.getElementById('startBtn').textContent === 'Start Audio') {
    	const timeout =  document.getElementById('offset').value;
    	setTimeout(startAudio,timeout);
    } else {
    	stopAudio();
    }
});

// Frequency  Controls
document.getElementById('freq').addEventListener('input', (e) => {
	 // Validation occurs in 'beforeinput'
    const freq = parseFloat(e.target.value);
    
    if (oscillator) {
        oscillator.frequency.value = freq; // Update oscillator frequency
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
