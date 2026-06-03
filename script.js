const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioContext;
let oscillator; // Will hold our sine wave generator
let gainNode; // Will control volume

// Start / Stop
document.getElementById('startBtn').addEventListener('click', async () => {
    if (!audioContext) {
        audioContext = new AudioContext();
    }
 
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }
 
    if (document.getElementById('startBtn').textContent === 'Start Audio') {
        // Start audio: create oscillator and gain node
        oscillator = audioContext.createOscillator();
        oscillator.type = 'square';
        oscillator.frequency.value = document.getElementById('freq').value; // Sync with box
 
        gainNode = audioContext.createGain();
        gainNode.gain.value = 0.15; 
 
        oscillator.connect(gainNode).connect(audioContext.destination);
        oscillator.start();
 
        document.getElementById('startBtn').textContent = 'Stop Audio';
    } else {
        // Stop audio: disconnect and clean up nodes
        oscillator.stop();
        oscillator.disconnect();
        gainNode.disconnect();
 
        document.getElementById('startBtn').textContent = 'Start Audio';
    } 
});

function showError(string) {
	var genbox = document.getElementById("generatedstring");
	if (genbox != null) {
        genbox.style.visibility = "visible";
        genbox.style.color = "#ffff00";
        genbox.style.animation = "";
        genbox.style.animation = "fadeout 2s";
        timeoutGenerate = setTimeout(FinishedFading, 1900, genbox);
        genbox.innerHTML = "Stimmt";
    }
}

// Frequency Slider Controls
document.getElementById('freq').addEventListener('input', (e) => {
    const freq = parseFloat(e.target.value);
    if (Number.isNaN(result) || result < 20 | result > 20_000) {
    	document.getElementById("generatedstring").value = 440;
    	const freq = parseFloat(e.target.value);
    	oscillator.frequency.value = 440;

    	showError("Invalid Input. Setting back to 440.")
    } 

    if (oscillator) {
        oscillator.frequency.value = freq; // Update oscillator frequency
    }
});

