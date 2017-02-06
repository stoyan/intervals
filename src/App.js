import React, { Component } from 'react';
import Teoria from 'teoria';
import Vex from 'vexflow';
import './App.css';

const startNotes =   ['F', 'G', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'A'];
const startOctaves = ['3', '3', '4', '4', '4', '4', '4', '4', '4', '5'];
const startAccidentals = ['', '#', '', 'b', ''];
const legalIntervals = [
  /*'P1'*/ 'P4', 'P5', 'P8', 
  /*'A1'*/ 'A4', 'A5', 'A8',
  /*'d1'*/ 'd4', 'd5', 'd8', 
  'M2', 'M3', 'M6', 'M7',
  'm2', 'm3', 'm6', 'm7',
  'A2', 'A3', 'A6', 'A7',
  'd2', 'd3', 'd6', 'd7',
];
const iOS = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);

let interval;
let bottomNote;
let topNote;

function getCount() {
  return null;
}
function getQuestion(i) {

  interval = Teoria.interval(legalIntervals[Math.floor(Math.random() * legalIntervals.length)]);

  const vf = new Vex.Flow.Factory({
    renderer: {selector: '_vex', width: 150, height: 220}
  });

  const score = vf.EasyScore();
  const system = vf.System();
  const rando = Math.floor(Math.random() * startNotes.length);
  bottomNote = Teoria.note(
    startNotes[rando] +
    startAccidentals[Math.floor(Math.random() * startAccidentals.length)] +
    startOctaves[rando]
  );
  
  try {
    topNote = Teoria.interval(bottomNote, interval.toString());
    system.addStave({
      voices: [
        score.voice(score.notes(topNote.toString().replace('x', '##') + '/w')),
        score.voice(score.notes(bottomNote + '/w')),
      ]
    }).addClef('treble');

    vf.draw();    
  } catch(_){
    return getQuestion();
  }
  return vf.context.svg;
}

function getAnswer(i) {
  return (
    <div>
      <p>{interval.toString()}</p>
      <p>{pretty(bottomNote)} to {pretty(topNote)} is a {interval.quality(1)} {interval.name()}</p>
    </div>
  );
}

function getAudio() {
  const low = new Audio('samples/' + getFileNote(bottomNote) + '.mp3');
  const high = new Audio('samples/' + getFileNote(topNote) + '.mp3');
  return {
    low,
    high,
  };
}

function getNormalNote(note) {
  if (note.accidentalValue() === 0) { // no sharp, nor flats
    return note.toString().toUpperCase();
  }
  if (note.accidentalValue() === 1) { // sharp
    return note.toString().replace('#', '-').toUpperCase();
  }
  return null;
}

function getFileNote(note) {
  const res = getNormalNote(note) || getNormalNote(note.enharmonics()[0]) || getNormalNote(note.enharmonics()[1]);
  return res.replace('E-', 'F').replace('B-', 'C');
}

function pretty(note) {
  return note.name().toUpperCase() + 
    note.accidental()
      .replace('#', '♯')
      .replace(/b/g, '♭')
      .replace('x', '𝄪');
}
// the actual quiz is done, boring stuff follows...

class App extends Component {
  constructor() {
    super();
    this.state = {
      question: getQuestion(1),
      answer: getAnswer(1),
      total: getCount(),
      i: 1,
      audio: getAudio(1),
    };
  }
  
  nextQuestion() {
    this.state.audio.low.pause();
    this.state.audio.high.pause();
    this.setState({
      question: getQuestion(this.state.i + 1),
      answer: getAnswer(this.state.i + 1),
      i: this.state.i + 1,
      audio: getAudio(this.state.i + 1),
    });
  }
  
  play() {
    const low = this.state.audio.low;
    const high = this.state.audio.high;
    low.pause();
    high.pause();
    low.currentTime = 0;
    high.currentTime = 0; 
    if (iOS) {
      low.play();
      high.play();
      return;
    }
    let end = false;
    low.play(); 
    low.addEventListener('ended', () => !end && high.play());
    high.addEventListener('ended', () => {
      if (!end) {
        end = true;
        low.currentTime = 0; low.play();
        high.currentTime = 0; high.play();
      }
    });
  }
  
  render() {
    return (
      <div>
        {
          this.state.total 
            ? <Count i={this.state.i} total={this.state.total} />
            : null
        }
        <Flashcard 
          question={this.state.question}
          answer={this.state.answer}
        />
        <button 
          className="playButton" 
          onClick={this.play.bind(this)}>
          {iOS ? 'play' : '▶'}
        </button>
        {' '}
        {
          (this.state.total && this.state.i >= this.state.total)
            ? null
            : <button 
                className="nextButton" 
                onClick={this.nextQuestion.bind(this)}>
                next...
              </button>
        }
      </div>
    );
  }
}

class Flashcard extends Component {

  constructor() {
    super();
    this.state = {
      reveal: false,
    };
  }

  componentWillReceiveProps() {
    this.setState({reveal: false});
  }

  flip() {
    this.setState({
      reveal: !this.state.reveal,
    });
  }

  render() {
    const className = "card flip-container" + (this.state.reveal ? ' flip' : '');
    return (
      <div><center>
        <div className={className} onClick={this.flip.bind(this)}>
          <div className="flipper">
            <div className="front" style={{display: this.state.reveal ? 'none' : ''}}>
              <div dangerouslySetInnerHTML={{__html: this.props.question.outerHTML}} />
            </div>
            <div className="back" style={{display: this.state.reveal ? '' : 'none'}}>
              {this.props.answer}
            </div>
          </div>
        </div>
        <button className="answerButton" onClick={this.flip.bind(this)}>flip</button>
      </center></div>
    );
  }
}

const Count = ({i, total}) =>
  <div>
    Question {i} / {total}
  </div>;

export default App;
