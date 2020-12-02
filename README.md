# rk002-sequence-editor

## Description
This project was inspired of idea of chaining Circuit sessions using program change MIDI messages coming from the Retrokits RK002 smart MIDI cable.


Original idea was borrowed from this video of <strong>Joel Raedeke</strong> on facebook:
https://www.facebook.com/541868830/videos/10157874187223831

## How to use
You need to connect RK002 cable to the Circuit as MIDI loopback. Yellow end goes to the input, black - to the output of the Circuit. 


This editor should work in conjunction with custom firmware for RK002, that can be downloaded [here]() <strong>TODO:</strong> insert link to github repo here 


Without this editor you can only record program changes "actions" into sequencer of the RK002. This editor can add some additional sequencer actions, such as Loop Sessions and Jump to Actions. You can edit parameters of all actions in the sequence as well, or made the sequence from scratch and upload it to the RK002.


Simulator can be used to check your sequence before uploading to the RK002 device.

## Types of the sequencer Actions and their meaning

- <strong>Switch Session</strong> - switches the session to the session number and waits for the set number of beats for the next action
- <strong>Loop Sessions</strong> - switches sessions (32 beats each) sequentially up or down a specified number of times, then moves to the next action in the sequence
- <strong>Loop Actions</strong> - loops over the actions in the sequencer. Not implemented yet.
- <strong>Jump to Action</strong> - jumps to the action number in the sequence. Could be used for infinite loops in the sequencer in order to overcome limitation of 30 steps in the sequencer.
- <strong>Stop Sequence</strong> - explicit stop for the sequencer. You can set switch to empty session on the previous step and the Circuit will "play" empty session after this sequencer command.

We have 3 bits for the action type Id, so we have space for another 2 actions to be implemented. All zeros means empty slot.


Sequencer counting beats, not microsteps. We have 256 beats (1 byte) available for the counter.


## How the storing and retrieving of the sequence is implemented
This is described in the repository for the [RK002 custom firmware]() <strong>TODO:</strong> insert link to github repo here

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
