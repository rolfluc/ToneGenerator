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

function validateFrequency(number) {
	if (Number.isNaN(result) || result < 20 | result > 20_000) {
		showError("Invalid Frequency found. Setting to 440");
		return 440;
	} else {
		return number;
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

// Frequency Slider Controls
document.getElementById('freq').addEventListener('input', (e) => {
    let freq = parseFloat(e.target.value);
    freq = validateFrequency(freq);
    
    if (oscillator) {
        oscillator.frequency.value = freq; // Update oscillator frequency
    }
});

