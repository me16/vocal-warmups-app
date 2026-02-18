import React, { useState, useEffect, useRef } from 'react';
import { Piano, KeyboardShortcuts, MidiNumbers } from 'react-piano';
import { SplendidGrandPiano, Soundfont } from 'smplr';
import 'react-piano/dist/styles.css';
import './App.css';

// Warmup patterns
// Enhanced warmups object with ascending/descending sequence support

const warmups = {
  // Original static exercises
  majorScale: {
    name: "Major Scale",
    type: "static",
    pattern: [0, 2, 4, 5, 7, 9, 11, 12, 11, 9, 7, 5, 4, 2, 0],
    rhythm: [1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2],
    syllables: "Do Re Mi Fa Sol La Ti Do Ti La Sol Fa Mi Re Do"
  },
  
  arpeggio: {
    name: "Major Arpeggio",
    type: "static",
    pattern: [0, 4, 7, 12, 7, 4, 0],
    rhythm: [1, 1, 1, 2, 1, 1, 2],
    syllables: "Do Mi Sol Do Sol Mi Do"
  },
  
  fifths: {
    name: "Ascending Fifths",
    type: "static",
    pattern: [0, 7, 0, 7, 0],
    rhythm: [2, 2, 2, 2, 4],
    syllables: "Ah Ah Ah Ah Ah"
  },
  
  octaveJumps: {
    name: "Octave Jumps",
    type: "static",
    pattern: [0, 12, 0, 12, 0],
    rhythm: [1, 1, 1, 1, 4],
    syllables: "Ha Ha Ha Ha Ha"
  },
  
  triad: {
    name: "Triad (1-3-5-3-1)",
    type: "static",
    pattern: [0, 4, 7, 4, 0],
    rhythm: [1, 1, 1, 1, 2],
    syllables: "Ma Me Mi Mo Mu"
  },

  // ============ NEW: Descending Sequence Exercises ============
  
  triadDescending: {
    name: "Triad - Descending (Range Explorer)",
    type: "descending",
    basePattern: [0, 4, 7, 4, 0],
    rhythm: [1, 1, 1, 1, 2],
    baseSyllables: "Ma Me Mi Mo Mu",
    stepSize: 2, // whole step
    iterations: 5
  },
  
  fifthsDescending: {
    name: "Fifths - Descending (Range Explorer)",
    type: "descending",
    basePattern: [0, 7, 0],
    rhythm: [2, 2, 4],
    baseSyllables: "Ah Ah Ah",
    stepSize: 2,
    iterations: 6
  },
  
  majorScaleDescending: {
    name: "Major Scale - Descending (Range Explorer)",
    type: "descending",
    basePattern: [0, 2, 4, 5, 7, 9, 11, 12, 11, 9, 7, 5, 4, 2, 0],
    rhythm: [1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2],
    baseSyllables: "Do Re Mi Fa Sol La Ti Do Ti La Sol Fa Mi Re Do",
    stepSize: 1, // semitone
    iterations: 12
  },
  
  arpeggioDescending: {
    name: "Arpeggio - Descending (Range Explorer)",
    type: "descending",
    basePattern: [0, 4, 7, 12, 7, 4, 0],
    rhythm: [1, 1, 1, 2, 1, 1, 2],
    baseSyllables: "Do Mi Sol Do Sol Mi Do",
    stepSize: 2,
    iterations: 6
  },

  // ============ NEW: Ascending Sequence Exercises ============
  
  triadAscending: {
    name: "Triad - Ascending (Range Building)",
    type: "ascending",
    basePattern: [0, 4, 7, 4, 0],
    rhythm: [1, 1, 1, 1, 2],
    baseSyllables: "Ma Me Mi Mo Mu",
    stepSize: 2, // whole step
    iterations: 5
  },
  
  fifthsAscending: {
    name: "Fifths - Ascending (Range Building)",
    type: "ascending",
    basePattern: [0, 7, 0],
    rhythm: [2, 2, 4],
    baseSyllables: "Ah Ah Ah",
    stepSize: 2,
    iterations: 6
  },
  
  majorScaleAscending: {
    name: "Major Scale - Ascending (Range Building)",
    type: "ascending",
    basePattern: [0, 2, 4, 5, 7, 9, 11, 12, 11, 9, 7, 5, 4, 2, 0],
    rhythm: [1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2],
    baseSyllables: "Do Re Mi Fa Sol La Ti Do Ti La Sol Fa Mi Re Do",
    stepSize: 1, // semitone
    iterations: 12
  },
  
  arpeggioAscending: {
    name: "Arpeggio - Ascending (Range Building)",
    type: "ascending",
    basePattern: [0, 4, 7, 12, 7, 4, 0],
    rhythm: [1, 1, 1, 2, 1, 1, 2],
    baseSyllables: "Do Mi Sol Do Sol Mi Do",
    stepSize: 2,
    iterations: 6
  },

  // ============ NEW: Up & Down Sequence (bidirectional) ============
  
  triadRoundTrip: {
    name: "Triad - Round Trip (Full Range)",
    type: "roundtrip",
    basePattern: [0, 4, 7, 4, 0],
    rhythm: [1, 1, 1, 1, 2],
    baseSyllables: "Ma Me Mi Mo Mu",
    stepSize: 2,
    iterations: 5 // goes down 5, then up 5
  },
  
  fifthsRoundTrip: {
    name: "Fifths - Round Trip (Full Range)",
    type: "roundtrip",
    basePattern: [0, 7, 0],
    rhythm: [2, 2, 4],
    baseSyllables: "Ah Ah Ah",
    stepSize: 2,
    iterations: 6
  }
};


// Vocal part ranges
const vocalRanges = {
  bass: { 
    root: MidiNumbers.fromNote('E2'), 
    color: '#1e40af',
    displayRange: { first: MidiNumbers.fromNote('E2'), last: MidiNumbers.fromNote('E4') }
  },
  baritone: { 
    root: MidiNumbers.fromNote('A2'), 
    color: '#059669',
    displayRange: { first: MidiNumbers.fromNote('A2'), last: MidiNumbers.fromNote('A4') }
  },
  tenor: { 
    root: MidiNumbers.fromNote('C3'), 
    color: '#d97706',
    displayRange: { first: MidiNumbers.fromNote('C3'), last: MidiNumbers.fromNote('C5') }
  },
  alto: { 
    root: MidiNumbers.fromNote('G3'), 
    color: '#dc2626',
    displayRange: { first: MidiNumbers.fromNote('G3'), last: MidiNumbers.fromNote('G5') }
  },
  soprano: { 
    root: MidiNumbers.fromNote('C4'), 
    color: '#9333ea',
    displayRange: { first: MidiNumbers.fromNote('C4'), last: MidiNumbers.fromNote('C6') }
  }
};

function App() {
  const [selectedWarmup, setSelectedWarmup] = useState('majorScale');
  const [vocalPart, setVocalPart] = useState('tenor');
  const [tempo, setTempo] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeNotes, setActiveNotes] = useState([]);
  const [currentSyllable, setCurrentSyllable] = useState('');
  const [loop, setLoop] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState('piano');
  const [instrumentLoaded, setInstrumentLoaded] = useState(false);
const [stepSize, setStepSize] = useState(2);
const [iterations, setIterations] = useState(5);
  
  const instrumentRef = useRef(null);
  const timeoutsRef = useRef([]);
  const audioContextRef = useRef(null);

  // Initialize audio context and instrument
  useEffect(() => {
    const initializeInstrument = async () => {
      setInstrumentLoaded(false);
      
      // Create audio context if it doesn't exist
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      
      const context = audioContextRef.current;
      
      // Dispose of old instrument
      if (instrumentRef.current) {
        instrumentRef.current.stop();
      }
      
      // Create new instrument based on selection
      let newInstrument;
      switch (selectedInstrument) {
        case 'piano':
          newInstrument = new SplendidGrandPiano(context, { volume: 90 });
          break;
        case 'marimba':
          newInstrument = new Soundfont(context, { instrument: 'marimba', volume: 90 });
          break;
        case 'cello':
          newInstrument = new Soundfont(context, { instrument: 'cello', volume: 90 });
          break;
        case 'vibraphone':
          newInstrument = new Soundfont(context, { instrument: 'vibraphone', volume: 90 });
          break;
        case 'flute':
          newInstrument = new Soundfont(context, { instrument: 'flute', volume: 90 });
          break;
        default:
          newInstrument = new SplendidGrandPiano(context, { volume: 90 });
      }

      instrumentRef.current = newInstrument;
      
      // Wait for instrument to load
      await newInstrument.load;
      setInstrumentLoaded(true);
    };

    initializeInstrument();

    return () => {
      if (instrumentRef.current) {
        instrumentRef.current.stop();
      }
    };
  }, [selectedInstrument]);

  // Clear all timeouts
  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current = [];
  };

  // Play a single note
  const playNote = (midiNumber) => {
    if (instrumentRef.current && instrumentLoaded && audioContextRef.current) {
      // Resume audio context if needed
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      // Use short duration to minimize reverb
      instrumentRef.current.start({ 
        note: midiNumber, 
        velocity: 80,
        duration: 0.5 // 500ms - short and crisp
      });
    }
  };

  // Stop note
  const stopNote = (midiNumber) => {
    // Note stops automatically with smplr
  };

  // Play warmup sequence
  // Enhanced playWarmup function to handle sequence variants
// Add this to your App.jsx, replacing the existing playWarmup function

const playWarmup = async () => {
  if (!instrumentLoaded || !instrumentRef.current || !audioContextRef.current) {
    console.warn('Instrument not loaded yet');
    return;
  }
  
  // Resume audio context if needed
  if (audioContextRef.current.state === 'suspended') {
    await audioContextRef.current.resume();
  }
  
  setIsPlaying(true);
  clearAllTimeouts();

  const warmup = warmups[selectedWarmup];
  const rootNote = vocalRanges[vocalPart].root;
  const beatDuration = (60 / tempo) * 1000; // ms per quarter note
  
  // Build the complete sequence based on exercise type
  let sequences = [];
  
  if (warmup.type === 'static') {
    // Static exercises: single pass
    sequences.push({
      pattern: warmup.pattern,
      rhythm: warmup.rhythm,
      syllables: warmup.syllables.split(' '),
      offset: 0,
      label: ''
    });
  } 
  else if (warmup.type === 'descending') {
    // Descending: start high, go down
    for (let i = 0; i < warmup.iterations; i++) {
      const offset = -(warmup.stepSize * i);
      sequences.push({
        pattern: warmup.basePattern,
        rhythm: warmup.rhythm,
        syllables: warmup.baseSyllables.split(' '),
        offset: offset,
        label: `(${i + 1}/${warmup.iterations})`
      });
    }
  }
  else if (warmup.type === 'ascending') {
    // Ascending: start low, go up
    for (let i = 0; i < warmup.iterations; i++) {
      const offset = warmup.stepSize * i;
      sequences.push({
        pattern: warmup.basePattern,
        rhythm: warmup.rhythm,
        syllables: warmup.baseSyllables.split(' '),
        offset: offset,
        label: `(${i + 1}/${warmup.iterations})`
      });
    }
  }
  else if (warmup.type === 'roundtrip') {
    // Round trip: down then back up
    const totalIterations = warmup.iterations * 2;
    
    // Descending phase
    for (let i = 0; i < warmup.iterations; i++) {
      const offset = -(warmup.stepSize * i);
      sequences.push({
        pattern: warmup.basePattern,
        rhythm: warmup.rhythm,
        syllables: warmup.baseSyllables.split(' '),
        offset: offset,
        label: `Down (${i + 1}/${warmup.iterations})`
      });
    }
    
    // Ascending phase (back up)
    for (let i = warmup.iterations - 2; i >= 0; i--) {
      const offset = -(warmup.stepSize * i);
      sequences.push({
        pattern: warmup.basePattern,
        rhythm: warmup.rhythm,
        syllables: warmup.baseSyllables.split(' '),
        offset: offset,
        label: `Up (${warmup.iterations - i}/${warmup.iterations})`
      });
    }
  }

  let currentTime = 0;

  // Play all sequences
  sequences.forEach((sequence, sequenceIndex) => {
    sequence.pattern.forEach((semitone, noteIndex) => {
      const midiNumber = rootNote + semitone + sequence.offset;
      const duration = sequence.rhythm[noteIndex] * beatDuration;
      
      const timeout1 = setTimeout(() => {
        setActiveNotes([midiNumber]);
        
        // Build syllable display with sequence label for variants
        const syllable = sequence.syllables[noteIndex] || '';
        const displayText = sequence.label ? `${syllable} ${sequence.label}` : syllable;
        setCurrentSyllable(displayText);
        
        // Play the note with reduced duration to minimize reverb
        if (instrumentRef.current) {
          instrumentRef.current.start({ 
            note: midiNumber, 
            velocity: 80,
            duration: (duration * 0.3) / 1000 // 30% of beat duration, smplr expects seconds
          });
        }
        
        const timeout2 = setTimeout(() => {
          setActiveNotes([]);
        }, duration * 0.35); // Match the shortened audio duration
        
        timeoutsRef.current.push(timeout2);
      }, currentTime);
      
      timeoutsRef.current.push(timeout1);
      currentTime += duration;
    });

    // Add a small pause between sequence iterations (optional, makes it clearer)
    const pauseBetweenSequences = beatDuration * 0.5;
    currentTime += pauseBetweenSequences;
  });

  // Handle end of complete sequence
  const endTimeout = setTimeout(() => {
    setIsPlaying(false);
    setActiveNotes([]);
    setCurrentSyllable('');
    
    if (loop) {
      playWarmup();
    }
  }, currentTime);
  
  timeoutsRef.current.push(endTimeout);
};

  // Stop playback
  const stopPlayback = () => {
    clearAllTimeouts();
    setIsPlaying(false);
    setActiveNotes([]);
    setCurrentSyllable('');
  };


  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, []);

  const baseDisplayRange = vocalRanges[vocalPart].displayRange;

  // Compute the actual note range needed for the current warmup so the piano
  // expands automatically when a Range Explorer exercise goes beyond the
  // vocal part's default display boundaries.
  const pianoRange = (() => {
    const warmup = warmups[selectedWarmup];
    const rootNote = vocalRanges[vocalPart].root;

    if (warmup.type === 'static') {
      return baseDisplayRange;
    }

    // Build the same offsets playWarmup uses
    let offsets = [];
    if (warmup.type === 'descending') {
      for (let i = 0; i < warmup.iterations; i++) offsets.push(-(warmup.stepSize * i));
    } else if (warmup.type === 'ascending') {
      for (let i = 0; i < warmup.iterations; i++) offsets.push(warmup.stepSize * i);
    } else if (warmup.type === 'roundtrip') {
      for (let i = 0; i < warmup.iterations; i++) offsets.push(-(warmup.stepSize * i));
      for (let i = warmup.iterations - 2; i >= 0; i--) offsets.push(-(warmup.stepSize * i));
    }

    let minNote = baseDisplayRange.first;
    let maxNote = baseDisplayRange.last;

    offsets.forEach(offset => {
      warmup.basePattern.forEach(semitone => {
        const midi = rootNote + semitone + offset;
        if (midi < minNote) minNote = midi;
        if (midi > maxNote) maxNote = midi;
      });
    });

    return { first: minNote, last: maxNote };
  })();

  const currentRange = pianoRange;

  return (
    <div className="app">
      <header className="header">
        <h1>🎵 Vocal Warmups</h1>
        <p>Interactive piano-based vocal exercises</p>
      </header>

      <main className="main-content">
        {/* Controls Section */}
        <section className="controls">
          <div className="control-group">
            <label htmlFor="instrument-select">Instrument:</label>
            <select 
              id="instrument-select"
              value={selectedInstrument} 
              onChange={(e) => setSelectedInstrument(e.target.value)}
              disabled={isPlaying}
            >
              <option value="piano">Grand Piano</option>
              <option value="marimba">Marimba</option>
              <option value="cello">Cello</option>
              <option value="vibraphone">Vibraphone</option>
              <option value="flute">Flute</option>
            </select>
            {!instrumentLoaded && (
              <span className="loading-indicator">Loading instrument...</span>
            )}
          </div>

          <div className="control-group">
            <label htmlFor="warmup-select">Warmup Exercise:</label>
            <select 
              id="warmup-select"
              value={selectedWarmup} 
              onChange={(e) => setSelectedWarmup(e.target.value)}
              disabled={isPlaying}
            >
              {Object.entries(warmups).map(([key, warmup]) => (
                <option key={key} value={key}>{warmup.name}</option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label>Vocal Part:</label>
            <div className="vocal-part-buttons">
              {Object.entries(vocalRanges).map(([key, range]) => (
                <button
                  key={key}
                  className={`vocal-part-btn ${vocalPart === key ? 'active' : ''}`}
                  style={{
                    backgroundColor: vocalPart === key ? range.color : 'transparent',
                    borderColor: range.color,
                    color: vocalPart === key ? 'white' : range.color
                  }}
                  onClick={() => setVocalPart(key)}
                  disabled={isPlaying}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <label htmlFor="tempo-slider">
              Tempo: {tempo} BPM
            </label>
            <input
              id="tempo-slider"
              type="range"
              min="60"
              max="180"
              value={tempo}
              onChange={(e) => setTempo(Number(e.target.value))}
              disabled={isPlaying}
            />
          </div>

          <div className="control-group">
            <label>
              <input
                type="checkbox"
                checked={loop}
                onChange={(e) => setLoop(e.target.checked)}
              />
              Loop Exercise
            </label>
          </div>

          <div className="playback-controls">
            <button 
              className="play-btn"
              onClick={playWarmup}
              disabled={isPlaying || !instrumentLoaded}
              title={!instrumentLoaded ? "Loading instrument..." : "Play warmup"}
            >
              ▶ Play
            </button>
            <button 
              className="stop-btn"
              onClick={stopPlayback}
              disabled={!isPlaying}
            >
              ■ Stop
            </button>
          </div>
        </section>

        {/* Syllable Display */}
        {currentSyllable && (
          <div className="syllable-display">
            <div className="syllable">{currentSyllable}</div>
          </div>
        )}

        {/* Piano Section */}
        <section className="piano-section">
          <div className="piano-container">
            <Piano
              noteRange={currentRange}
              playNote={playNote}
              stopNote={stopNote}
              activeNotes={activeNotes}
              width={1000}
              keyboardShortcuts={KeyboardShortcuts.create({
                firstNote: currentRange.first,
                lastNote: currentRange.last,
                keyboardConfig: KeyboardShortcuts.HOME_ROW,
              })}
            />
          </div>
          <p className="piano-hint">
            Range: {MidiNumbers.getAttributes(currentRange.first).note} - {MidiNumbers.getAttributes(currentRange.last).note}
          </p>
        </section>

        {/* Info Section */}
        <section className="info-section">
          <h2>How to Use</h2>
          <ol>
            <li>Select an instrument and wait for it to load</li>
            <li>Choose a warmup exercise from the dropdown</li>
            <li>Choose your vocal part (adjusts the pitch range automatically)</li>
            <li>Adjust the tempo to your preference</li>
            <li>Press Play to hear and see the exercise</li>
            <li>Enable Loop to repeat continuously</li>
            <li>Click piano keys to explore your range</li>
          </ol>
        </section>
      </main>
    </div>
  );
}

export default App;