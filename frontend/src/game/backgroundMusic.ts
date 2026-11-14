import songUrl from '../assets/audio/table-music.mp3';

// Background music for the game table. It uses the Web Audio API rather than <audio loop>,
// which leaves a gap at the end of every pass.
//
// The song is 20 bars at about 172 bpm. The music starts 0.1 s into the file and fades out just
// after 28 s, followed by silence and a click at 28.4 s. Each new pass starts 80 beats after the
// previous one, on the beat where the song would carry on, so it comes in while the old pass is
// fading out and the rhythm never skips.
const FIRST_NOTE = 0.1;           // seconds into the file
const BEAT = 0.3495;              // seconds
const LOOP_LENGTH = 80 * BEAT;    // from the start of one pass to the start of the next
const TAIL_END = 28.36;           // the old pass is silent by here, before the click
const TAIL_FADE = 0.35;           // finishes the song's own fade-out
const VOLUME = 0.15;              // background level, under the game
const FADE_IN = 1.5;
const FADE_OUT = 2;
const QUEUE_AHEAD = 2 * LOOP_LENGTH; // queued in advance, so throttled timers can't leave a gap

const OFF_KEY = 'blackjack.musicOff';

interface Pass {
    source: AudioBufferSourceNode;
    envelope: GainNode;
}

let context: AudioContext | null = null;
let master: GainNode | null = null;
let song: Promise<AudioBuffer> | null = null;
let wanted = false;   // the game wants music right now
let playing = false;  // passes are queued
let nextPass = 0;     // audio-clock time the next pass starts
let passes: Pass[] = [];
let queueTimer: number | undefined;
let haltTimer: number | undefined;

export function musicOff(): boolean {
    try { return localStorage.getItem(OFF_KEY) === '1'; } catch { return false; }
}

export function saveMusicOff(off: boolean): void {
    try {
        if (off) localStorage.setItem(OFF_KEY, '1');
        else localStorage.removeItem(OFF_KEY);
    } catch { /* storage unavailable; the choice lasts until the page reloads */ }
}

function audio(): AudioContext | null {
    if (context) return context;
    if (typeof AudioContext === 'undefined') return null;
    const created = new AudioContext();
    master = created.createGain();
    master.gain.value = 0;
    master.connect(created.destination);
    // Pause along with the tab. The audio clock stops too, so queued passes stay in time.
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) void created.suspend();
        else if (playing) void created.resume();
    });
    context = created;
    return created;
}

function loadSong(ctx: AudioContext): Promise<AudioBuffer> {
    if (!song) {
        song = fetch(songUrl)
            .then((response) => {
                if (!response.ok) throw new Error(`Music failed to load (${response.status})`);
                return response.arrayBuffer();
            })
            .then((bytes) => ctx.decodeAudioData(bytes));
        song.catch(() => { song = null; }); // try again the next time the game starts
    }
    return song;
}

// Browsers only allow sound after the player interacts with the page, and Safari only during the
// interaction itself, so the game calls this from its button clicks.
export function unlockMusic(): void {
    const ctx = audio();
    if (!ctx) return;
    if (ctx.state === 'suspended' && !document.hidden) void ctx.resume();
    loadSong(ctx).catch(() => { /* startMusic reports nothing either; the game works without music */ });
    if (wanted) void startMusic();
}

function fadeTo(volume: number, seconds: number): void {
    if (!context || !master) return;
    const gain = master.gain;
    const now = context.currentTime;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.linearRampToValueAtTime(volume, now + seconds);
}

function queuePasses(buffer: AudioBuffer): void {
    if (!context || !master) return;
    const length = TAIL_END - FIRST_NOTE;
    while (nextPass < context.currentTime + QUEUE_AHEAD) {
        const start = nextPass;
        const source = context.createBufferSource();
        source.buffer = buffer;
        const envelope = context.createGain();
        envelope.gain.setValueAtTime(0, start);
        envelope.gain.linearRampToValueAtTime(1, start + 0.02);
        envelope.gain.setValueAtTime(1, start + length - TAIL_FADE);
        envelope.gain.linearRampToValueAtTime(0, start + length);
        source.connect(envelope).connect(master);
        source.start(start, FIRST_NOTE, length);
        const pass = { source, envelope };
        source.onended = () => {
            envelope.disconnect();
            passes = passes.filter((p) => p !== pass);
        };
        passes.push(pass);
        nextPass += LOOP_LENGTH;
    }
}

// Fades the music in, from the top of the song if it isn't already playing.
export async function startMusic(): Promise<void> {
    wanted = true;
    window.clearTimeout(haltTimer);
    // Before the player's first click, wait for unlockMusic rather than make a context the browser blocks.
    if (!context && navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
    const ctx = audio();
    if (!ctx) return;
    if (ctx.state === 'suspended' && !document.hidden) void ctx.resume();
    let buffer: AudioBuffer;
    try {
        buffer = await loadSong(ctx);
    } catch {
        return; // no music is better than a broken game
    }
    if (!wanted) return;
    if (!playing) {
        playing = true;
        nextPass = ctx.currentTime + 0.05;
        queuePasses(buffer);
        queueTimer = window.setInterval(() => queuePasses(buffer), 5000);
    }
    fadeTo(VOLUME, FADE_IN);
}

// Fades the music out, then stops it so the next attempt starts from the top of the song.
export function stopMusic(): void {
    wanted = false;
    if (!playing) return;
    fadeTo(0, FADE_OUT);
    window.clearTimeout(haltTimer);
    haltTimer = window.setTimeout(halt, FADE_OUT * 1000 + 100);
}

function halt(): void {
    window.clearInterval(queueTimer);
    for (const { source, envelope } of passes) {
        source.onended = null;
        source.stop();
        source.disconnect();
        envelope.disconnect();
    }
    passes = [];
    playing = false;
}
