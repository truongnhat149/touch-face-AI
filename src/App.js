
import { Howl } from 'howler';
import { useEffect, useRef, useState } from 'react';
import { initNotifications, notify } from '@mycv/f8-notification';
import '@tensorflow/tfjs-backend-webgl';

import './App.css';
import soundHand from './assets/hey_sondn.mp3';

const mobilenetModule = require('@tensorflow-models/mobilenet');
const knnClassifier = require('@tensorflow-models/knn-classifier');

const NOT_TOUCH_LABEL = 'not_touch';
const TOUCHED_LABEL = 'touched';
const TRAINING_TIMES = 50;
const TOUCHED_CONFIDENCE = 0.8;

var sound = new Howl({
  src: [soundHand]
});

function App() {
  const video = useRef();
  const mobilenet = useRef();
  const classifier = useRef();
  const [touched, setTouched] = useState(false);
  const canPlaySound = useRef(false);

  const init = async () => {
    console.log('init...');
    await setupCamera();
    console.log('setup Camera success');

    mobilenet.current = await mobilenetModule.load();
    
    classifier.current = knnClassifier.create();

    console.log('setup done');
    console.log("Don't your touch face and press train 1");

    initNotifications({ cooldown: 3000 });
  };

  const setupCamera = () => {
    return new Promise((resolve, reject) => {
      navigator.getUserMedia = navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;

        if (navigator.getUserMedia) {
          navigator.getUserMedia(
            { video: true },
            stream => {
              video.current.srcObject = stream;
              video.current.addEventListener('loadeddata', resolve);
            },
            error => reject(error)
          ); 
        } else {
          reject();
        }
    })
  };

const train = async label => {
  console.log(`${label} training your face handsome`);
  for (let i = 0; i < TRAINING_TIMES; i++) {
    console.log(`Progress ${parseInt((i+1) / TRAINING_TIMES * 100)}%`);

    await training(label);
  }
}

const training = label => {
  return new Promise(async resolve => {
    const embedding = mobilenet.current.infer(
      video.current,
      true
    );
    classifier.current.addExample(embedding, label);
    await sleep(100);
    resolve();
  });
}

const run = async () => {
  const embedding = mobilenet.current.infer(
    video.current,
    true
  );
  const result = await classifier.current.predictClass(embedding);
  
  if (
    result.label === TOUCHED_LABEL &&
    result.confidences[result.label] > TOUCHED_CONFIDENCE
  ) {
    console.log('Touched');
    if (canPlaySound.current) {
      canPlaySound.current = false;
      sound.play();
    }
    notify('Touch hand', { body: 'heiiii, you touched face!!!' });
    setTouched(true);
  } else {
    console.log('Not touch');
    setTouched(false);
  }

  await sleep(200);

  run();
}

const sleep = (ms = 0) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

  useEffect(() => {
    init();

    sound.on('end', function() {
      canPlaySound.current = true;
    });    

    // cleanup
    return () => {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`main ${touched ? 'touched' : ''}`}>
       <video
        ref= {video}
        className="video"
        autoPlay
       />

      <div className="control">
        <button className='btn' onClick={() => train(NOT_TOUCH_LABEL)}>Train 1</button>
        <button className='btn' onClick={() => train(TOUCHED_LABEL)}>Train 2</button>
        <button className='btn' onClick={() => run()}>Run</button>
      </div>
    
    </div>
  );
}

export default App;
