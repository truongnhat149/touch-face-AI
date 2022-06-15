
import { useEffect, useRef } from 'react';
import '@tensorflow/tfjs-backend-webgl';
import './App.css';
// import { Howl } from 'howler';

// import soundHand from './assets/hey_sondn.mp3';

const tf = require('@tensorflow/tfjs');
const mobilenetModule = require('@tensorflow-models/mobilenet');
const knnClassifier = require('@tensorflow-models/knn-classifier');

// var sound = new Howl({
//   src: [soundHand]
// });

// sound.play();

const NOT_TOUCH_LABEL = 'not_touch';
const TOUCHED_LABEL = 'touched';
const TRAINING_TIMES = 50;

function App() {
  const video = useRef();
  const mobilenet = useRef();
  const classifier = useRef();
  
  const init = async () => {
    console.log('init...');
    await setupCamera();
    console.log('setup Camera success');

    mobilenet.current = await mobilenetModule.load();
    
    classifier.current = knnClassifier.create();

    console.log('setup done');
    console.log("Don't your touch face and press train 1");
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

const sleep = (ms = 0) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

  useEffect(() => {
    init();

    // cleanup
    return () => {}
  }, []);

  return (
    <div className="main">
       <video
        ref= {video}
        className="video"
        autoPlay
       />

      <div className="control">
        <button className='btn' onClick={() => train(NOT_TOUCH_LABEL)}>Train 1</button>
        <button className='btn' onClick={() => train(TOUCHED_LABEL)}>Train 2</button>
        <button className='btn' onClick={() => {}}>Run</button>
      </div>
    
    </div>
  );
}

export default App;
