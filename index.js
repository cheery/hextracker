
/**
 * @name hextracker
 */

export var pi  = Math.PI;
export var tau = 2*Math.PI;
export var sin = Math.sin;
export var cos = Math.cos;

var track = new Track("40d:45b 42b 44c 45a:40b 44b 42c 40d:41b 42a:44a:46a:47a 44c:45a 3Ab:35c 3Bc:38c 40b:43c:45c");

var instrument = Instrument();

export function dsp(t) {
  if (!track.running) track.start(t);
  return instrument(t, track.run(t, 5+tri(t)*2.5+sin(t/10)*5)) * 0.1;
}

function Instrument() {
  var bank = [];
  var gens = {a: Math.sin, b: saw, c: sqr, d: tri};
  return function(t, commands) {
    var i;
    var sum = 0;
    if (commands.length > 0) bank = [];
    for (i = 0; i < commands.length; i++) {
      if (gens[commands[i].name]) bank.push(commands[i]);
    }
    for (i = 0; i < bank.length; i++) {
      var c = bank[i];
      sum += gens[c.name](t*tau*hexmidi(c.value)) / bank.length;
    }
    return sum;
  };
}

export default Track;

export function Track(string) {
  var segments = string.split(' ');
  this.sequence = [];
  for(var i = 0; i < segments.length; i++) {
    var subsegments = segments[i].split(':');
    var commands = [];
    var command;
    for(var j = 0; j < subsegments.length; j++) {
      if ((command = subsegments[j].match(/([0-9a-fA-F]+)(.)/))) {
        commands.push({value:parseInt(command[1], 16), name:command[2]});
      }
    }
    this.sequence.push(commands);
  }
  this.index = -1;
  this.position = 0;
  this.running = false;
}

Track.prototype.start = function(t) {
  this.index = -1;
  this.position = 0;
  this.running = true;
};

Track.prototype.stop = function() {
  this.running = false;
};

Track.prototype.run = function(t, rate) {
  if(this.running) {
    this.position += rate/sampleRate;
    var index = this.position | 0;
    if (this.index != index) {
      this.index = index;
      return this.sequence[this.index % this.sequence.length];
    }
  }
  return [];
};

export function base12(hexadecimal) {
  return (hexadecimal >> 4)*12 + (hexadecimal & 15);
}

export function midi(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

export function hexmidi(hexadecimal) {
  return midi(base12(hexadecimal));
}

export function saw(t) {
  return (pi - t % tau) / pi;
}

export function sqr(t) {
  return (pi < t % tau) ? +1 : -1;
}

export function tri(t) {
  return Math.abs(1 - (t % tau)/pi) * 2 - 1;
}

export function clamp(x, low, high) {
  return Math.min(Math.max(x, low), high);
}

export function Delay(maxDuration) {
  this.mem = new Float32Array(maxDuration*sampleRate);
  this.index = 0;
}

Delay.prototype.read = function(duration) {
  var n = this.mem.length;
  var offset = clamp(duration*sampleRate | 0, 0, n-1);
  if (duration === undefined) offset = n-1;
  return this.mem[(n+this.index-offset)%n];
}

Delay.prototype.write = function(x) {
  this.mem[this.index] = x;
  this.index = (this.index + 1) % this.mem.length;
}