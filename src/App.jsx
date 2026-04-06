import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Piano, KeyboardShortcuts, MidiNumbers } from 'react-piano';
import { SplendidGrandPiano, Soundfont } from 'smplr';
import 'react-piano/dist/styles.css';
import './App.css';

// ─── Chord intro definitions ─────────────────────────────────────────────────
const CHORD_INTROS = {
  majorScale:           [0, 4, 7],
  majorScaleDescending: [0, 4, 7],
  majorScaleAscending:  [0, 4, 7],
  arpeggio:             [0, 4, 7],
  arpeggioDescending:   [0, 4, 7],
  arpeggioAscending:    [0, 4, 7],
  triad:                [0, 4, 7],
  triadDescending:      [0, 4, 7],
  triadAscending:       [0, 4, 7],
  triadRoundTrip:       [0, 4, 7],
  fifths:               [0, 7],
  fifthsDescending:     [0, 7],
  fifthsAscending:      [0, 7],
  fifthsRoundTrip:      [0, 7],
};

// ─── Rhythm presets ──────────────────────────────────────────────────────────
const RHYTHM_PRESETS = [
  { id: 'original',   label: 'Original',   desc: "Restore the exercise's default rhythm",           apply: (base) => [...base] },
  { id: 'even',       label: 'Even',        desc: 'All notes equal — good for learning pitches',     apply: (base) => base.map(() => 1) },
  { id: 'first-held', label: 'Hold 1st',   desc: 'First note long, rest quick — classic choral entry', apply: (base) => base.map((_, i) => i === 0 ? 3 : 0.5) },
  { id: 'last-held',  label: 'Hold Last',  desc: 'Last note stretched — builds breath support',     apply: (base) => base.map((_, i) => i === base.length - 1 ? 3 : 1) },
  { id: 'dotted',     label: 'Dotted',     desc: 'Long–short pairs — forward momentum',             apply: (base) => base.map((_, i) => i % 2 === 0 ? 1.5 : 0.5) },
  { id: 'staccato',   label: 'Staccato',   desc: 'Short, detached — crisp articulation',            apply: (base) => base.map(() => 0.5) },
];

// Duration levels user can cycle through per note block
const DURATION_LEVELS = [
  { value: 0.25, label: '¼' },
  { value: 0.5,  label: '½' },
  { value: 1,    label: '1' },
  { value: 1.5,  label: '1½' },
  { value: 2,    label: '2' },
  { value: 3,    label: '3' },
];

function nearestLevel(val) {
  return DURATION_LEVELS.reduce((prev, curr) =>
    Math.abs(curr.value - val) < Math.abs(prev.value - val) ? curr : prev
  );
}
function nextLevel(val) {
  const idx = DURATION_LEVELS.findIndex(l => l.value === nearestLevel(val).value);
  return DURATION_LEVELS[(idx + 1) % DURATION_LEVELS.length].value;
}

// ─── Warmup data ─────────────────────────────────────────────────────────────
const warmups = {
  majorScale:           { name: 'Major Scale',              type: 'static',    pattern: [0,2,4,5,7,9,11,12,11,9,7,5,4,2,0], rhythm: [1,1,1,1,1,1,1,2,1,1,1,1,1,1,2], syllables: 'Do Re Mi Fa Sol La Ti Do Ti La Sol Fa Mi Re Do' },
  arpeggio:             { name: 'Major Arpeggio',            type: 'static',    pattern: [0,4,7,12,7,4,0],                    rhythm: [1,1,1,2,1,1,2],                  syllables: 'Do Mi Sol Do Sol Mi Do' },
  fifths:               { name: 'Ascending Fifths',          type: 'static',    pattern: [0,7,0,7,0],                         rhythm: [2,2,2,2,4],                      syllables: 'Ah Ah Ah Ah Ah' },
  octaveJumps:          { name: 'Octave Jumps',              type: 'static',    pattern: [0,12,0,12,0],                       rhythm: [1,1,1,1,4],                      syllables: 'Ha Ha Ha Ha Ha' },
  triad:                { name: 'Triad (1–3–5–3–1)',         type: 'static',    pattern: [0,4,7,4,0],                         rhythm: [1,1,1,1,2],                      syllables: 'Ma Me Mi Mo Mu' },
  triadDescending:      { name: 'Triad – Descending',        type: 'descending',  basePattern: [0,4,7,4,0],   rhythm: [1,1,1,1,2], baseSyllables: 'Ma Me Mi Mo Mu', stepSize: 2, iterations: 5 },
  fifthsDescending:     { name: 'Fifths – Descending',       type: 'descending',  basePattern: [0,7,0],        rhythm: [2,2,4],    baseSyllables: 'Ah Ah Ah',       stepSize: 2, iterations: 6 },
  majorScaleDescending: { name: 'Major Scale – Descending',  type: 'descending',  basePattern: [0,2,4,5,7,9,11,12,11,9,7,5,4,2,0], rhythm: [1,1,1,1,1,1,1,2,1,1,1,1,1,1,2], baseSyllables: 'Do Re Mi Fa Sol La Ti Do Ti La Sol Fa Mi Re Do', stepSize: 1, iterations: 12 },
  arpeggioDescending:   { name: 'Arpeggio – Descending',     type: 'descending',  basePattern: [0,4,7,12,7,4,0], rhythm: [1,1,1,2,1,1,2], baseSyllables: 'Do Mi Sol Do Sol Mi Do', stepSize: 2, iterations: 6 },
  triadAscending:       { name: 'Triad – Ascending',         type: 'ascending',   basePattern: [0,4,7,4,0],   rhythm: [1,1,1,1,2], baseSyllables: 'Ma Me Mi Mo Mu', stepSize: 2, iterations: 5 },
  fifthsAscending:      { name: 'Fifths – Ascending',        type: 'ascending',   basePattern: [0,7,0],        rhythm: [2,2,4],    baseSyllables: 'Ah Ah Ah',       stepSize: 2, iterations: 6 },
  majorScaleAscending:  { name: 'Major Scale – Ascending',   type: 'ascending',   basePattern: [0,2,4,5,7,9,11,12,11,9,7,5,4,2,0], rhythm: [1,1,1,1,1,1,1,2,1,1,1,1,1,1,2], baseSyllables: 'Do Re Mi Fa Sol La Ti Do Ti La Sol Fa Mi Re Do', stepSize: 1, iterations: 12 },
  arpeggioAscending:    { name: 'Arpeggio – Ascending',      type: 'ascending',   basePattern: [0,4,7,12,7,4,0], rhythm: [1,1,1,2,1,1,2], baseSyllables: 'Do Mi Sol Do Sol Mi Do', stepSize: 2, iterations: 6 },
  triadRoundTrip:       { name: 'Triad – Round Trip',        type: 'roundtrip',   basePattern: [0,4,7,4,0],   rhythm: [1,1,1,1,2], baseSyllables: 'Ma Me Mi Mo Mu', stepSize: 2, iterations: 5 },
  fifthsRoundTrip:      { name: 'Fifths – Round Trip',       type: 'roundtrip',   basePattern: [0,7,0],        rhythm: [2,2,4],    baseSyllables: 'Ah Ah Ah',       stepSize: 2, iterations: 6 },
};

const vocalRanges = {
  bass:     { root: MidiNumbers.fromNote('E2'), color: '#3dd68c', textColor: '#0e0e10', displayRange: { first: MidiNumbers.fromNote('E2'), last: MidiNumbers.fromNote('E4') } },
  baritone: { root: MidiNumbers.fromNote('A2'), color: '#2dd4bf', textColor: '#0e0e10', displayRange: { first: MidiNumbers.fromNote('A2'), last: MidiNumbers.fromNote('A4') } },
  tenor:    { root: MidiNumbers.fromNote('C3'), color: '#f5a623', textColor: '#0e0e10', displayRange: { first: MidiNumbers.fromNote('C3'), last: MidiNumbers.fromNote('C5') } },
  alto:     { root: MidiNumbers.fromNote('G3'), color: '#f87171', textColor: '#0e0e10', displayRange: { first: MidiNumbers.fromNote('G3'), last: MidiNumbers.fromNote('G5') } },
  soprano:  { root: MidiNumbers.fromNote('C4'), color: '#c084fc', textColor: '#0e0e10', displayRange: { first: MidiNumbers.fromNote('C4'), last: MidiNumbers.fromNote('C6') } },
};

// ─── RhythmEditor ─────────────────────────────────────────────────────────────
function RhythmEditor({ baseRhythm, customRhythm, onChange, syllables, disabled }) {
  const syllableList = (syllables || '').split(' ');

  const handleBlockClick = (i) => {
    if (disabled) return;
    const updated = [...customRhythm];
    updated[i] = nextLevel(updated[i]);
    onChange(updated);
  };

  return (
    <div className="rhythm-editor">
      <div className="rhythm-presets-row">
        {RHYTHM_PRESETS.map(p => (
          <button
            key={p.id}
            className="rp-chip"
            onClick={() => !disabled && onChange(p.apply(baseRhythm))}
            disabled={disabled}
            title={p.desc}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="rhythm-blocks-row">
        {customRhythm.map((val, i) => {
          const level = nearestLevel(val);
          const heightPct = Math.round(Math.min(100, (val / 3) * 100));
          return (
            <button
              key={i}
              className={`rb ${disabled ? 'rb--disabled' : ''}`}
              onClick={() => handleBlockClick(i)}
              disabled={disabled}
              title={`${syllableList[i] || `Note ${i+1}`}: ${level.label} beats — click to cycle`}
            >
              <span className="rb__track">
                <span className="rb__bar" style={{ height: `${Math.max(12, heightPct)}%` }} />
              </span>
              <span className="rb__beat">{level.label}</span>
              {syllableList[i] && <span className="rb__syl">{syllableList[i]}</span>}
            </button>
          );
        })}
      </div>
      <p className="rhythm-editor-hint">Click a bar to cycle its duration</p>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  const [selectedWarmup, setSelectedWarmup]         = useState('majorScale');
  const [vocalPart, setVocalPart]                   = useState('tenor');
  const [tempo, setTempo]                           = useState(120);
  const [isPlaying, setIsPlaying]                   = useState(false);
  const [activeNotes, setActiveNotes]               = useState([]);
  const [currentSyllable, setCurrentSyllable]       = useState('');
  const [loop, setLoop]                             = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState('piano');
  const [instrumentLoaded, setInstrumentLoaded]     = useState(false);
  const [chordIntroEnabled, setChordIntroEnabled]   = useState(false);
  const [customRhythm, setCustomRhythm]             = useState(() => [...warmups.majorScale.rhythm]);

  const instrumentRef   = useRef(null);
  const timeoutsRef     = useRef([]);
  const audioContextRef = useRef(null);

  const handleWarmupChange = (key) => {
    setSelectedWarmup(key);
    setCustomRhythm([...warmups[key].rhythm]);
    if (!CHORD_INTROS[key]) setChordIntroEnabled(false);
  };

  useEffect(() => {
    const init = async () => {
      setInstrumentLoaded(false);
      if (!audioContextRef.current) audioContextRef.current = new AudioContext();
      const ctx = audioContextRef.current;
      if (instrumentRef.current) instrumentRef.current.stop();
      let inst;
      switch (selectedInstrument) {
        case 'marimba':    inst = new Soundfont(ctx, { instrument: 'marimba',    volume: 90 }); break;
        case 'cello':      inst = new Soundfont(ctx, { instrument: 'cello',      volume: 90 }); break;
        case 'vibraphone': inst = new Soundfont(ctx, { instrument: 'vibraphone', volume: 90 }); break;
        case 'flute':      inst = new Soundfont(ctx, { instrument: 'flute',      volume: 90 }); break;
        default:           inst = new SplendidGrandPiano(ctx, { volume: 90 });
      }
      instrumentRef.current = inst;
      await inst.load;
      setInstrumentLoaded(true);
    };
    init();
    return () => { if (instrumentRef.current) instrumentRef.current.stop(); };
  }, [selectedInstrument]);

  const clearAllTimeouts = () => { timeoutsRef.current.forEach(clearTimeout); timeoutsRef.current = []; };

  const playNote  = (midi) => { if (instrumentRef.current && instrumentLoaded) instrumentRef.current.start({ note: midi, velocity: 80 }); setActiveNotes([midi]); };
  const stopNote  = (midi) => { if (instrumentRef.current) instrumentRef.current.stop({ note: midi }); setActiveNotes([]); };

  const playWarmup = useCallback(() => {
    if (isPlaying) return;
    if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();
    clearAllTimeouts();
    setIsPlaying(true);
    setCurrentSyllable('');

    const warmup      = warmups[selectedWarmup];
    const rootNote    = vocalRanges[vocalPart].root;
    const beatDuration = (60 / tempo) * 1000;
    const mkSyl = (str) => str.split(' ');

    let sequences = [];
    if (warmup.type === 'static') {
      sequences.push({ notes: warmup.pattern.map(s => rootNote + s), rhythm: customRhythm, syllables: mkSyl(warmup.syllables), label: null });
    } else if (warmup.type === 'descending') {
      for (let i = 0; i < warmup.iterations; i++) {
        const off = -(warmup.stepSize * i);
        sequences.push({ notes: warmup.basePattern.map(s => rootNote + s + off), rhythm: customRhythm, syllables: mkSyl(warmup.baseSyllables), label: off ? `(${off})` : null });
      }
    } else if (warmup.type === 'ascending') {
      for (let i = 0; i < warmup.iterations; i++) {
        const off = warmup.stepSize * i;
        sequences.push({ notes: warmup.basePattern.map(s => rootNote + s + off), rhythm: customRhythm, syllables: mkSyl(warmup.baseSyllables), label: off ? `(+${off})` : null });
      }
    } else if (warmup.type === 'roundtrip') {
      for (let i = 0; i < warmup.iterations; i++) {
        const off = -(warmup.stepSize * i);
        sequences.push({ notes: warmup.basePattern.map(s => rootNote + s + off), rhythm: customRhythm, syllables: mkSyl(warmup.baseSyllables), label: off ? `(${off})` : null });
      }
      for (let i = warmup.iterations - 2; i >= 0; i--) {
        const off = -(warmup.stepSize * i);
        sequences.push({ notes: warmup.basePattern.map(s => rootNote + s + off), rhythm: customRhythm, syllables: mkSyl(warmup.baseSyllables), label: off ? `(${off})` : null });
      }
    }

    let t = 50;

    const chordDef = CHORD_INTROS[selectedWarmup];
    const scheduleChord = (rootNote, atTime) => {
      const dur  = beatDuration * 2;
      const midis = chordDef.map(s => rootNote + s);
      const tid = setTimeout(() => {
        setCurrentSyllable('♩');
        setActiveNotes(midis);
        midis.forEach(m => {
          if (instrumentRef.current) {
            instrumentRef.current.start({ note: m, velocity: 65, duration: dur * 0.85 / 1000 });
          }
        });
        const tid2 = setTimeout(() => setActiveNotes([]), dur * 0.9);
        timeoutsRef.current.push(tid2);
      }, atTime);
      timeoutsRef.current.push(tid);
      return dur + beatDuration * 0.25;
    };

    sequences.forEach(seq => {
      if (chordIntroEnabled && chordDef) {
        const seqRoot = seq.notes[0] - (
          warmup.type === 'static'
            ? (warmup.pattern?.[0] ?? 0)
            : (warmup.basePattern?.[0] ?? 0)
        );
        t += scheduleChord(seqRoot, t);
      }

      seq.notes.forEach((midi, ni) => {
        const dur = beatDuration * (seq.rhythm[ni] ?? 1);
        const tid = setTimeout(() => {
          setActiveNotes([midi]);
          const syl = seq.syllables[ni] || '';
          setCurrentSyllable(seq.label ? `${syl} ${seq.label}` : syl);
          if (instrumentRef.current) {
            instrumentRef.current.start({ note: midi, velocity: 80, duration: dur * 0.3 / 1000 });
          }
          const tid2 = setTimeout(() => setActiveNotes([]), dur * 0.35);
          timeoutsRef.current.push(tid2);
        }, t);
        timeoutsRef.current.push(tid);
        t += dur;
      });
      t += beatDuration * 0.5;
    });

    const endTid = setTimeout(() => {
      setIsPlaying(false);
      setActiveNotes([]);
      setCurrentSyllable('');
      if (loop) playWarmup();
    }, t);
    timeoutsRef.current.push(endTid);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, selectedWarmup, vocalPart, tempo, customRhythm, chordIntroEnabled, loop]);

  const stopPlayback = () => { clearAllTimeouts(); setIsPlaying(false); setActiveNotes([]); setCurrentSyllable(''); };
  useEffect(() => () => clearAllTimeouts(), []);

  const baseDisplayRange = vocalRanges[vocalPart].displayRange;
  const pianoRange = (() => {
    const warmup = warmups[selectedWarmup];
    const rootNote = vocalRanges[vocalPart].root;
    if (warmup.type === 'static') return baseDisplayRange;
    let offsets = [];
    if (warmup.type === 'descending')      for (let i = 0; i < warmup.iterations; i++) offsets.push(-(warmup.stepSize * i));
    else if (warmup.type === 'ascending')  for (let i = 0; i < warmup.iterations; i++) offsets.push(warmup.stepSize * i);
    else if (warmup.type === 'roundtrip') { for (let i = 0; i < warmup.iterations; i++) offsets.push(-(warmup.stepSize * i)); for (let i = warmup.iterations - 2; i >= 0; i--) offsets.push(-(warmup.stepSize * i)); }
    let minNote = baseDisplayRange.first, maxNote = baseDisplayRange.last;
    offsets.forEach(off => warmup.basePattern.forEach(s => { const m = rootNote + s + off; if (m < minNote) minNote = m; if (m > maxNote) maxNote = m; }));
    return { first: minNote, last: maxNote };
  })();

  const currentWarmup = warmups[selectedWarmup];
  const hasChordIntro = !!CHORD_INTROS[selectedWarmup];
  const activeRange   = vocalRanges[vocalPart];

  return (
    <div className="app">
      <header className="header">
        <h1>Vocal Warmups</h1>
        <p>Piano-guided vocal exercises</p>
      </header>

      <main className="main-content">

        {/* ── Controls panel ─────────────────────────────────────────── */}
        <section className="controls">

          {/* Instrument */}
          <div className="control-group">
            <label htmlFor="instrument-select">
              Instrument
              {!instrumentLoaded && <span className="loading-indicator"> · loading…</span>}
            </label>
            <select id="instrument-select" value={selectedInstrument} onChange={e => setSelectedInstrument(e.target.value)} disabled={isPlaying}>
              <option value="piano">Grand Piano</option>
              <option value="marimba">Marimba</option>
              <option value="cello">Cello</option>
              <option value="vibraphone">Vibraphone</option>
              <option value="flute">Flute</option>
            </select>
          </div>

          {/* Exercise */}
          <div className="control-group">
            <label htmlFor="warmup-select">Warmup Exercise</label>
            <select id="warmup-select" value={selectedWarmup} onChange={e => handleWarmupChange(e.target.value)} disabled={isPlaying}>
              {Object.entries(warmups).map(([key, w]) => <option key={key} value={key}>{w.name}</option>)}
            </select>
          </div>

          {/* Rhythm editor */}
          <div className="control-group">
            <label>Rhythm</label>
            <RhythmEditor
              baseRhythm={currentWarmup.rhythm}
              customRhythm={customRhythm}
              onChange={setCustomRhythm}
              syllables={currentWarmup.syllables || currentWarmup.baseSyllables}
              disabled={isPlaying}
            />
          </div>

          {/* Chord intro */}
          {hasChordIntro && (
            <div className="control-group chord-intro-group">
              <label className="chord-toggle-label">
                <span className="toggle-switch">
                  <input type="checkbox" checked={chordIntroEnabled} onChange={e => setChordIntroEnabled(e.target.checked)} disabled={isPlaying} />
                  <span className="toggle-knob" />
                </span>
                <span className="chord-toggle-text">
                  Tonic chord intro
                  <span className="chord-toggle-sub">
                    Plays {CHORD_INTROS[selectedWarmup].length === 2 ? 'root + fifth' : 'I triad (Do–Mi–Sol)'} before exercise
                  </span>
                </span>
              </label>
            </div>
          )}

          <div className="controls-divider" />

          {/* Vocal part */}
          <div className="control-group">
            <label>Vocal Part</label>
            <div className="vocal-part-buttons">
              {Object.entries(vocalRanges).map(([key, range]) => (
                <button
                  key={key}
                  className={`vocal-part-btn ${vocalPart === key ? 'active' : ''}`}
                  style={{
                    borderColor: range.color,
                    color: vocalPart === key ? range.textColor : range.color,
                    backgroundColor: vocalPart === key ? range.color : 'transparent',
                  }}
                  onClick={() => setVocalPart(key)}
                  disabled={isPlaying}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tempo */}
          <div className="control-group">
            <div className="tempo-row">
              <span className="tempo-label-text">Tempo</span>
              <span className="tempo-value">{tempo}<span>bpm</span></span>
            </div>
            <input id="tempo-slider" type="range" min="60" max="180" value={tempo} onChange={e => setTempo(Number(e.target.value))} disabled={isPlaying} />
          </div>

          {/* Loop */}
          <div className="control-group">
            <label className="loop-label">
              <input className="loop-check" type="checkbox" checked={loop} onChange={e => setLoop(e.target.checked)} />
              Loop exercise
            </label>
          </div>

          {/* Playback */}
          <div className="playback-controls">
            <button className="play-btn" onClick={playWarmup} disabled={isPlaying || !instrumentLoaded}>
              ▶ Play
            </button>
            <button className="stop-btn" onClick={stopPlayback} disabled={!isPlaying}>
              ■ Stop
            </button>
          </div>
        </section>

        {/* ── Syllable display ──────────────────────────────────────── */}
        {currentSyllable && (
          <div className="syllable-display">
            <div className="syllable">{currentSyllable}</div>
          </div>
        )}

        {/* ── Piano ────────────────────────────────────────────────── */}
        <section className="piano-section">
          <div className="piano-container">
            <Piano
              noteRange={pianoRange}
              playNote={playNote}
              stopNote={stopNote}
              activeNotes={activeNotes}
              width={1000}
              keyboardShortcuts={KeyboardShortcuts.create({
                firstNote: pianoRange.first,
                lastNote: pianoRange.last,
                keyboardConfig: KeyboardShortcuts.HOME_ROW,
              })}
            />
          </div>
          <p className="piano-hint">
            {MidiNumbers.getAttributes(pianoRange.first).note} – {MidiNumbers.getAttributes(pianoRange.last).note}
          </p>
        </section>

        {/* ── How to use ───────────────────────────────────────────── */}
        <section className="info-section">
          <h2>How to Use</h2>
          <ol>
            <li>Select an instrument and wait for it to load</li>
            <li>Choose a warmup exercise from the dropdown</li>
            <li>Apply a rhythm preset or click individual bars to fine-tune note durations</li>
            <li>Enable the tonic chord intro on supported exercises — the conventional choral tuning cue</li>
            <li>Select your vocal part and set the desired tempo</li>
            <li>Press Play — enable Loop to repeat continuously</li>
          </ol>
        </section>

      </main>
    </div>
  );
}

export default App;