#!/usr/bin/env python3
"""Medieval-flavoured sound effects, synthesised in code (original, no samples, no licences to track).

Usage: python3 scripts/make_sfx.py [out.wav]      writes a numbered sampler of every effect (default out/sfx-sampler.wav)

Every function returns a mono float32 array at 48 kHz, peak-normalised to 1.0 (the mixer sets the level).
Effects: bell, gavel, stamp, quill, page, lute_up, lute_sad, lute_tick, timpani, clunk, gong, pin, crackle.
No audio can be auditioned in the build environment, so shapes follow how the real sound behaves (decay times,
partial ratios, noise bands) and the sampler lets the owner judge them by ear.
"""
import sys
import wave

import numpy as np

SR = 48000
RNG = np.random.default_rng(7)


# ------------------------------------------------------------------ helpers
def T(sec):
    return np.arange(int(sec * SR)) / SR


def peak(x, level=1.0):
    m = float(np.max(np.abs(x))) or 1.0
    return (x / m * level).astype(np.float32)


def fft_filter(x, kind, f1, f2=None, order=4):
    n = len(x)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    if kind == "lp":
        H = 1 / np.sqrt(1 + (f / f1) ** (2 * order))
    elif kind == "hp":
        H = 1 / np.sqrt(1 + (f1 / np.maximum(f, 1e-6)) ** (2 * order))
    else:  # bp
        H = (1 / np.sqrt(1 + (f / f2) ** (2 * order))) * (1 / np.sqrt(1 + (f1 / np.maximum(f, 1e-6)) ** (2 * order)))
    return np.fft.irfft(X * H, n)


def noise(sec):
    return RNG.standard_normal(int(sec * SR)).astype(np.float32)


def reverb(x, tail=1.2, mix=0.25, tau=0.35, tilt=4500):
    """Stone-hall style reverb: convolve with a decaying, darkened noise impulse response."""
    n_ir = int(tail * SR)
    ir = RNG.standard_normal(n_ir) * np.exp(-np.arange(n_ir) / SR / tau)
    ir = fft_filter(ir, "lp", tilt, order=2)
    ir[0] = 0
    ir /= np.sqrt(np.sum(ir**2)) + 1e-9
    n = len(x) + n_ir
    wet = np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(ir, n), n)
    dry = np.pad(x, (0, n - len(x)))
    out = dry * (1 - mix) + wet * mix * 2.2
    return out.astype(np.float32)


def fade(x, a=0.003, b=0.02):
    x = x.copy()
    na, nb = int(a * SR), int(b * SR)
    if na:
        x[:na] *= np.linspace(0, 1, na)
    if nb:
        x[-nb:] *= np.linspace(1, 0, nb)
    return x


def place(buf, x, at):
    i = int(at * SR)
    if i + len(x) > len(buf):
        buf = np.pad(buf, (0, i + len(x) - len(buf)))
    buf[i : i + len(x)] += x
    return buf


# ------------------------------------------------------------------ effects
def bell(f0=196.0, sec=6.0):
    """Church bell: inharmonic partials (hum, prime, tierce, quint, nominal...) with slow, staggered decay."""
    t = T(sec)
    ratios = [0.5, 1.0, 1.19, 1.5, 2.0, 2.5, 3.0, 4.0, 5.2]
    amps = [0.55, 1.0, 0.7, 0.5, 0.4, 0.28, 0.2, 0.12, 0.07]
    decs = [5.0, 3.8, 3.0, 2.4, 1.8, 1.3, 1.0, 0.7, 0.45]
    x = np.zeros_like(t)
    for r, a, d in zip(ratios, amps, decs):
        for det in (-0.0015, 0.0015):  # a slightly detuned twin makes the bell shimmer
            x += a * np.sin(2 * np.pi * f0 * r * (1 + det) * t + RNG.uniform(0, 6.28)) * np.exp(-t / d) * 0.5
    strike = fft_filter(noise(0.06), "bp", 600, 5000) * np.exp(-T(0.06) / 0.012)
    x[: len(strike)] += strike * 0.6
    x = reverb(fade(x, 0.002, 0.6), tail=2.4, mix=0.3, tau=0.9)
    return peak(x)


def knock(freq=420.0):
    t = T(0.35)
    x = np.zeros_like(t)
    for m, a, tau in [(1.0, 1.0, 0.035), (2.4, 0.6, 0.02), (4.1, 0.3, 0.012)]:
        x += a * np.sin(2 * np.pi * freq * m * t + RNG.uniform(0, 6.28)) * np.exp(-t / tau)
    x += 0.9 * np.sin(2 * np.pi * 110 * t) * np.exp(-t / 0.05)
    click = fft_filter(noise(0.35), "hp", 1500) * np.exp(-t / 0.003)
    x += 0.7 * click
    return peak(reverb(fade(x, 0.0005, 0.05), tail=0.7, mix=0.2, tau=0.25))


def gavel(n=1, spacing=0.22):
    buf = np.zeros(int((0.4 + spacing * n) * SR), dtype=np.float32)
    for k in range(n):
        buf = place(buf, knock(RNG.uniform(380, 450)) * (1.0 if k == n - 1 else 0.85), k * spacing)
    return peak(buf)


def stamp():
    """A heavy stamp or wax-seal press: low thud with a pitch drop, a paper slap and a short room tail."""
    t = T(0.9)
    f = 55 + 65 * np.exp(-t / 0.04)
    thud = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.13)
    body = fft_filter(noise(0.9), "lp", 900) * np.exp(-t / 0.035)
    slap = fft_filter(noise(0.9), "bp", 1800, 6000) * np.exp(-t / 0.012)
    x = thud * 1.0 + body * 0.6 + slap * 0.35
    return peak(reverb(fade(x, 0.0005, 0.2), tail=0.9, mix=0.22, tau=0.3))


def quill(strokes=5):
    out = np.zeros(int(0.6 * SR), dtype=np.float32)
    pos = 0.0
    for _ in range(strokes):
        L = RNG.uniform(0.06, 0.11)
        t = T(L)
        x = fft_filter(noise(L), "bp", 1800, 7000) * np.sin(np.pi * t / L) ** 0.6
        x *= 1 + 0.6 * np.sin(2 * np.pi * RNG.uniform(60, 95) * t)
        out = place(out, x * RNG.uniform(0.6, 1.0), pos)
        pos += L + RNG.uniform(0.01, 0.04)
        if pos > 0.5:
            break
    return peak(fade(out[: int(0.6 * SR)], 0.004, 0.05))


def page():
    L = 0.45
    t = T(L)
    base = fft_filter(noise(L), "bp", 300, 4500)
    env = np.sin(np.pi * t / L) ** 2
    x = base * env
    for _ in range(8):  # paper crackle
        i = int(RNG.uniform(0.03, 0.4) * SR)
        c = fft_filter(noise(0.01), "hp", 2500) * np.exp(-T(0.01) / 0.002)
        x[i : i + len(c)] += c[: len(x) - i] * RNG.uniform(0.4, 1.0)
    return peak(fade(x, 0.01, 0.06))


def _ks(freq, sec=1.6, damp=0.9965):
    n = max(2, int(SR / freq))
    buf = RNG.uniform(-1, 1, n)
    buf = (buf + np.roll(buf, 1)) * 0.5
    out = np.empty(int(sec * SR))
    idx = 0
    for i in range(len(out)):
        out[i] = buf[idx]
        nxt = buf[(idx + 1) % n]
        buf[idx] = damp * 0.5 * (buf[idx] + nxt)
        idx = (idx + 1) % n
    # a small wooden body resonance
    ir = fft_filter(noise(0.08), "bp", 180, 1800) * np.exp(-T(0.08) / 0.02)
    body = np.convolve(out, ir / (np.max(np.abs(ir)) + 1e-9), mode="full")[: len(out)]
    x = out * 0.75 + body * 0.012
    return fade(x, 0.001, 0.25)


NOTE = {"D3": 146.83, "G3": 196.0, "A3": 220.0, "F3": 174.61, "D4": 293.66, "F4": 349.23, "A4": 440.0, "D5": 587.33, "C4": 261.63}


def lute_up():
    buf = np.zeros(int(1.6 * SR), dtype=np.float32)
    for k, n in enumerate(["D4", "F4", "A4", "D5"]):
        buf = place(buf, _ks(NOTE[n], 1.2) * (0.8 + 0.07 * k), k * 0.1)
    return peak(reverb(buf, tail=0.8, mix=0.18, tau=0.3))


def lute_sad():
    buf = np.zeros(int(1.8 * SR), dtype=np.float32)
    buf = place(buf, _ks(NOTE["A3"], 1.2), 0.0)
    buf = place(buf, _ks(NOTE["F3"], 1.4) * 0.9, 0.3)
    return peak(reverb(buf, tail=0.8, mix=0.18, tau=0.3))


def lute_tick(note="A4"):
    return peak(reverb(_ks(NOTE[note], 1.0), tail=0.6, mix=0.15, tau=0.25))


def timpani(f=72.0):
    t = T(1.8)
    fr = f + 38 * np.exp(-t / 0.05)
    x = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / 0.5)
    x += 0.3 * np.sin(2 * np.pi * np.cumsum(fr * 1.5) / SR) * np.exp(-t / 0.18)
    x += 0.5 * fft_filter(noise(1.8), "lp", 400) * np.exp(-t / 0.02)
    return peak(reverb(fade(x, 0.001, 0.4), tail=1.2, mix=0.25, tau=0.5))


def clunk():
    t = T(0.6)
    x = np.zeros_like(t)
    for f, a, d in [(210, 1.0, 0.18), (540, 0.7, 0.11), (1180, 0.4, 0.07), (1900, 0.25, 0.04)]:
        x += a * np.sin(2 * np.pi * f * t + RNG.uniform(0, 6.28)) * np.exp(-t / d)
    x += 0.6 * fft_filter(noise(0.6), "hp", 2000) * np.exp(-t / 0.004)
    return peak(reverb(fade(fft_filter(x, "lp", 5000), 0.0005, 0.1), tail=0.5, mix=0.15, tau=0.2))


def gong():
    t = T(4.0)
    x = np.zeros_like(t)
    for r, a, d in [(1.0, 1.0, 3.0), (1.5, 0.5, 2.4), (2.02, 0.45, 2.0), (2.9, 0.3, 1.4), (3.4, 0.2, 1.0)]:
        for det in (-0.004, 0.004):
            x += a * np.sin(2 * np.pi * 55 * r * (1 + det) * t) * np.exp(-t / d) * 0.5
    x *= 1 - np.exp(-t / 0.08)
    return peak(reverb(fade(x, 0.0, 0.8), tail=2.0, mix=0.3, tau=0.8))


def pin():
    t = T(0.25)
    x = np.sin(2 * np.pi * 2300 * t) * np.exp(-t / 0.012) + 0.7 * np.sin(2 * np.pi * 310 * t) * np.exp(-t / 0.025)
    x += 0.4 * fft_filter(noise(0.25), "hp", 3000) * np.exp(-t / 0.003)
    return peak(reverb(fade(x, 0.0005, 0.05), tail=0.4, mix=0.15, tau=0.15))


def crackle(sec):
    """Fire in a stone hall: a soft low rumble with random pops."""
    n = int(sec * SR)
    rumble = fft_filter(RNG.standard_normal(n), "bp", 60, 260)
    rumble *= 0.6 + 0.4 * np.sin(2 * np.pi * 0.17 * np.arange(n) / SR + RNG.uniform(0, 6.28))
    pops = np.zeros(n, dtype=np.float32)
    for _ in range(int(sec * 9)):
        i = RNG.integers(0, n - 400)
        L = int(RNG.uniform(0.001, 0.005) * SR)
        c = fft_filter(RNG.standard_normal(L + 60), "hp", 1800)[:L] * np.exp(-np.arange(L) / (L / 3))
        pops[i : i + L] += c * RNG.uniform(0.2, 1.0) ** 2
    x = rumble / (np.max(np.abs(rumble)) + 1e-9) * 0.5 + pops / (np.max(np.abs(pops)) + 1e-9) * 0.5
    return peak(fft_filter(x, "lp", 7000))


LIB = {
    "bell": bell, "gavel": gavel, "stamp": stamp, "quill": quill, "page": page, "lute_up": lute_up,
    "lute_sad": lute_sad, "lute_tick": lute_tick, "timpani": timpani, "clunk": clunk, "gong": gong, "pin": pin,
}


def sampler(path):
    names = list(LIB)
    out = np.zeros(int(1 * SR), dtype=np.float32)
    cursor = 0.5
    log = []
    for nme in names:
        x = LIB[nme]() * 0.7
        out = place(out, x, cursor)
        log.append((nme, cursor))
        cursor += min(len(x) / SR, 4.5) + 1.0
    out = place(out, crackle(6) * 0.3, cursor)
    log.append(("crackle (fire ambience)", cursor))
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(out, -1, 1) * 32767).astype(np.int16).tobytes())
    for nme, t0 in log:
        print(f"{t0:6.1f}s  {nme}")


if __name__ == "__main__":
    import os

    p = sys.argv[1] if len(sys.argv) > 1 else "out/sfx-sampler.wav"
    os.makedirs(os.path.dirname(p) or ".", exist_ok=True)
    sampler(p)
