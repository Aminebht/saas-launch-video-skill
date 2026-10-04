#!/usr/bin/env python3
"""Profile music tracks so they can be described (reference) or aligned (candidates).

    python analyze-track.py track.mp3 [more.mp3 ...] [--drop 35.9] [--detail]

Prints tempo, key, a per-second loudness strip (0-9) and bass-share strip, the big energy
rises/falls, and, with --drop T, the start offset that puts the track's biggest rise on
video time T. --detail adds a per-second table (use it on a reference track to describe it).
Needs: pip install librosa (ffmpeg/audioread decodes mp3/mp4).
"""
import argparse
import numpy as np
import librosa

KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
MAJOR = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
MINOR = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])


def profile(path, drop, detail):
    y, sr = librosa.load(path, sr=22050, mono=True)
    dur = len(y) / sr
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units="time")
    tempo = float(np.atleast_1d(tempo)[0])
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr).mean(axis=1)
    keys = sorted(
        [(np.corrcoef(chroma, np.roll(MAJOR, i))[0, 1], KEYS[i] + " major") for i in range(12)]
        + [(np.corrcoef(chroma, np.roll(MINOR, i))[0, 1], KEYS[i] + " minor") for i in range(12)],
        reverse=True,
    )
    hop = 512
    rms = librosa.feature.rms(y=y, hop_length=hop)[0]
    S = np.abs(librosa.stft(y, hop_length=hop)) ** 2
    f = librosa.fft_frequencies(sr=sr)
    low = S[f < 150].sum(0) / (S.sum(0) + 1e-12)
    cent = librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=hop)[0]
    t = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=hop)
    peak = rms.max()

    print(f"== {path}")
    print(f"   {dur:.2f}s  tempo ~{tempo:.1f} BPM  first beat {beats[0]:.2f}s  key ~{keys[0][1]} (alt {keys[1][1]})")
    secs = range(int(np.ceil(dur)))
    db = [20 * np.log10(rms[(t >= s) & (t < s + 1)].mean() / peak + 1e-9) for s in secs]
    lo = [100 * low[(t >= s) & (t < s + 1)].mean() for s in secs]
    print("   loud: " + "".join(str(max(0, min(9, int((d + 30) / 3.3)))) for d in db))
    print("   bass: " + "".join(str(max(0, min(9, int(v / 10.5)))) for v in lo))
    print("   sec : " + "".join(str(s % 10) for s in secs))

    q = 0.25
    seg = np.array([rms[(t >= a) & (t < a + q)].mean() for a in np.arange(0, dur, q)])
    seg = 20 * np.log10(seg / peak + 1e-9)
    diffs = np.diff(seg)
    rises = [(i * q + q, d) for i, d in enumerate(diffs) if d > 7]
    falls = [(i * q + q, d) for i, d in enumerate(diffs) if d < -9]
    print("   rises: " + (", ".join(f"{a:.2f}s(+{d:.0f}dB)" for a, d in rises) or "none"))
    print("   falls: " + (", ".join(f"{a:.2f}s({d:.0f}dB)" for a, d in falls) or "none"))
    tail = 20 * np.log10(rms[t > dur - 1.0].mean() / peak + 1e-9)
    print(f"   ending: last second at {tail:.0f} dB ({'fades/rings out' if tail < -20 else 'ends hot: trim or fade it'})")

    # biggest rise after the first second = the drop
    late = [(a, d) for a, d in rises if a > 1.0]
    if late:
        big = max(late, key=lambda r: r[1])
        print(f"   biggest rise (drop) at {big[0]:.2f}s")
        if drop is not None:
            off = drop - big[0]
            print(f"   -> start the track at {off:+.2f}s on the video to land the drop on {drop}s"
                  + ("" if off >= 0 else " (negative: trim the track head instead)"))
    elif drop is not None:
        print("   no clear drop: align the start to a cut, or its fade-out to the video end")

    if detail:
        print("\n    sec  loud_dB  bright_Hz  bass%")
        for s in secs:
            m = (t >= s) & (t < s + 1)
            print(f"   {s:4d}  {db[s]:7.1f}  {cent[m].mean():9.0f}  {lo[s]:5.0f}")
        h, p = librosa.effects.hpss(y)
        print(f"   harmonic/percussive energy ratio {np.sum(h**2) / np.sum(p**2):.2f} (>2 = pads/bass led, <1 = drum led)")
    print()


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("files", nargs="+")
    ap.add_argument("--drop", type=float, help="video time (s) where the track's drop should land")
    ap.add_argument("--detail", action="store_true")
    a = ap.parse_args()
    for f in a.files:
        profile(f, a.drop, a.detail)
