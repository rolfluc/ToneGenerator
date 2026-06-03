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
        oscillator.frequency.value = document.getElementById('freqSlider').value; // Sync with slider
 
        gainNode = audioContext.createGain();
        gainNode.gain.value = document.getElementById('volSlider').value; // Sync with slider
 
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

// Frequency Slider Controls
document.getElementById('freqSlider').addEventListener('input', (e) => {
    const freq = parseFloat(e.target.value);
    if (oscillator) {
        oscillator.frequency.value = freq; // Update oscillator frequency
    }
    document.getElementById('freqValue').textContent = freq; // Update display
});


// Update volume when slider changes
document.getElementById('volSlider').addEventListener('input', (e) => {
    const vol = parseFloat(e.target.value);
    if (gainNode) {
        gainNode.gain.value = vol; // Update gain
    }
    document.getElementById('volValue').textContent = vol.toFixed(2); // Update display
});