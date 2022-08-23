'use strict';

import { math } from "math";

// zzfx() - the universal entry point -- returns a AudioBufferSourceNode
//@ts-ignore
export let zzfx = (...t) => zzfx_play(zzfxGenerate(...t));

//@ts-ignore
export let zzfx_play = (...m) => { let f = zzfx_context.createBuffer(m.length, m[0].length, zzfx_sample_rate), d = zzfx_context.createBufferSource(); m.map((b, n) => f.getChannelData(n).set(b)); d.buffer = f; d.connect(zzfx_context.destination); d.start(); return d; };
let zzfxGenerate = (m = 1, f = .05, d = 220, b = 0, n = 0, t = .1, r = 0, D = 1, u = 0, z = 0, v = 0, A = 0, k = 0, E = 0, B = 0, F = 0, e = 0, w = 1, p = 0, C = 0) => { let c = 2 * math.PI, G = u *= 500 * c / zzfx_sample_rate / zzfx_sample_rate; f = d *= (1 + 2 * f * math.random() - f) * c / zzfx_sample_rate; let x = [], h = 0, H = 0, a = 0, q = 1, I = 0, J = 0, g = 0, y, l; b = zzfx_sample_rate * b + 9; p *= zzfx_sample_rate; n *= zzfx_sample_rate; t *= zzfx_sample_rate; e *= zzfx_sample_rate; z *= 500 * c / zzfx_sample_rate ** 3; B *= c / zzfx_sample_rate; v *= c / zzfx_sample_rate; A *= zzfx_sample_rate; k = zzfx_sample_rate * k | 0; for (l = b + p + n + t + e | 0; a < l; x[a++] = g)++J % (100 * F | 0) || (g = r ? 1 < r ? 2 < r ? 3 < r ? math.sin((h % c) ** 3) : math.max(math.min(math.tan(h), 1), -1) : 1 - (2 * h / c % 2 + 2) % 2 : 1 - 4 * math.abs(math.round(h / c) - h / c) : math.sin(h), g = (k ? 1 - C + C * math.sin(c * a / k) : 1) * (0 < g ? 1 : -1) * math.abs(g) ** D * m * zzfx_volume * (a < b ? a / b : a < b + p ? 1 - (a - b) / p * (1 - w) : a < b + p + n ? w : a < l - e ? (l - a - e) / t * w : 0), g = e ? g / 2 + (e > a ? 0 : (a < l - e ? 1 : (l - a) / e) * x[a - e | 0] / 2) : g), y = (d += u += z) * math.cos(B * H++), h += y - y * E * (1 - 1E9 * (math.sin(a) + 1) % 2), q && ++q > A && (d += v, f += v, q = 0), !k || ++I % k || (d = f, u = G, q = q || 1); return x; };

//zzfxV - global volume
let zzfx_volume = 0.5;

// zzfxR - global sample rate
let zzfx_sample_rate: number = 44100;

// zzfxX - the common audio context
let zzfx_context: AudioContext;

export let zzfx_init = (): void =>
{
  if (!zzfx_context)
    zzfx_context = new AudioContext();
};