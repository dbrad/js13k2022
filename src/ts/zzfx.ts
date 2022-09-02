'use strict';

import { math, max } from "math";

// zzfx() - the universal entry point -- returns a AudioBufferSourceNode
//@ts-ignore
export let zzfx = (...t) => zzfx_play(zzfx_generate(...t));

//@ts-ignore
export let zzfx_play = (...m) => { let f = zzfx_context.createBuffer(m.length, m[0].length, zzfx_sample_rate), d = zzfx_context.createBufferSource(); m.map((b, n) => f.getChannelData(n).set(b)); d.buffer = f; d.connect(zzfx_context.destination); d.start(); return d; };

//@ts-ignore
let zzfx_generate = (m = 1, f = .05, d = 220, b = 0, n = 0, t = .1, r = 0, D = 1, u = 0, z = 0, v = 0, A = 0, k = 0, E = 0, B = 0, F = 0, e = 0, w = 1, p = 0, C = 0) => { let c = 2 * math.PI, G = u *= 500 * c / zzfx_sample_rate / zzfx_sample_rate; f = d *= (1 + 2 * f * math.random() - f) * c / zzfx_sample_rate; let x = [], h = 0, H = 0, a = 0, q = 1, I = 0, J = 0, g = 0, y, l; b = zzfx_sample_rate * b + 9; p *= zzfx_sample_rate; n *= zzfx_sample_rate; t *= zzfx_sample_rate; e *= zzfx_sample_rate; z *= 500 * c / zzfx_sample_rate ** 3; B *= c / zzfx_sample_rate; v *= c / zzfx_sample_rate; A *= zzfx_sample_rate; k = zzfx_sample_rate * k | 0; for (l = b + p + n + t + e | 0; a < l; x[a++] = g)++J % (100 * F | 0) || (g = r ? 1 < r ? 2 < r ? 3 < r ? math.sin((h % c) ** 3) : max(math.min(math.tan(h), 1), -1) : 1 - (2 * h / c % 2 + 2) % 2 : 1 - 4 * math.abs(math.round(h / c) - h / c) : math.sin(h), g = (k ? 1 - C + C * math.sin(c * a / k) : 1) * (0 < g ? 1 : -1) * math.abs(g) ** D * m * zzfx_volume * (a < b ? a / b : a < b + p ? 1 - (a - b) / p * (1 - w) : a < b + p + n ? w : a < l - e ? (l - a - e) / t * w : 0), g = e ? g / 2 + (e > a ? 0 : (a < l - e ? 1 : (l - a) / e) * x[a - e | 0] / 2) : g), y = (d += u += z) * math.cos(B * H++), h += y - y * E * (1 - 1E9 * (math.sin(a) + 1) % 2), q && ++q > A && (d += v, f += v, q = 0), !k || ++I % k || (d = f, u = G, q = q || 1); return x; };

//zzfxV - global volume
let zzfx_volume = 0.3;

// zzfxR - global sample rate
let zzfx_sample_rate: number = 44100;

// zzfxX - the common audio context
let zzfx_context: AudioContext;

export let buff_sound: number[];
export let heal_sound: number[];
export let boop_good: number[];
export let boop: number[];
export let hit: number[];
let bass: number[];
let wooo: number[];

export let zzfx_init = (): void =>
{
  if (!zzfx_context)
    zzfx_context = new AudioContext();

  buff_sound = zzfx_generate(...[, .2, 162, .06, .17, .4, , , -6.5, , -60, .03, .01, , , .1, .2, .59, .29]);
  heal_sound = zzfx_generate(...[, .2, 640, .08, .13, .42, 2, 1.08, -3.4, , 36, .03, .09, , , , , .59, .22, .44]);
  boop_good = zzfx_generate(...[, .1, 440, .05, .05, , , , , , 200, .06, , , , , , .5, .05, 1]);
  boop = zzfx_generate(...[, .1, , .05, .05, , , , , , 200, .06, , , , , , .5, .05]);
  hit = zzfx_generate(...[, , 197, .01, .05, .08, 3, 2.75, .4, , , , , 2, -8.6, .4, .08, .87, .01]);
  bass = zzfx_generate(...[, 0, 60, , .05, .15, , .5, , , , , , , , , , .25, .15]);
  wooo = zzfx_generate(...[, 0, 440, .1, 1, .2, 1, , -0.1, , , , , , , , .5, .1, .05]);
};

let beat = 0;
let timer = 1000;
let track_number = 0;
let mute_music = false;
export let change_track = (track: number) => { track_number = track; beat = 0; timer = 1000; };
export let play_music = (delta: number) =>
{
  if (!mute_music)
  {
    timer -= delta;
    if (timer <= 0)
    {
      if (!track_number)
      {
        timer = beat === 1 ? 4000 : beat === 4 ? 2000 : 1000;
        beat < 4 ? zzfx_play(bass) : zzfx_play(wooo);
        beat = (beat + 1) % 5;
      }
      else
      {
        timer = beat === 1 ? 700 : beat === 3 ? 3500 : beat === 4 ? 500 : 175;
        zzfx_play(bass);
        beat = (beat + 1) % 5;
      }
    }
  }
};
