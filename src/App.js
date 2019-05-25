import React, {Component} from 'react';
import _ from 'lodash';
import FaceDetector from './ml/faceDetection';
import EmotionDetector from './ml/emotionDetection';
import AgeGenderDetector from './ml/ageGender';
import './App.css';
import Result from "./Result";

class App extends Component {
  faceDetector = new FaceDetector();
  emotionDetector = new EmotionDetector();
  ageGenderDetector = new AgeGenderDetector();
  webcam = React.createRef();
  canvas = React.createRef();
  timer = 0;
 
  newLink = "images/man/0.jpg"
  startTimer = this.startTimer.bind(this);
  state = {
    emotionPredictions: [],
    gender: null,
    modelsLoaded: false,
    webcamAllowed: null,
    counter: 10,
    link: "images/man/0.jpg",
    adIndex: 0
  };

  delay = ms => new Promise(_ => setTimeout(_, ms));

  connectToWebcam = () => {
    if (navigator.mediaDevices.getUserMedia) {
      return navigator.mediaDevices.getUserMedia({video: true})
        .then((stream) => {
          this.webcam.current.srcObject = stream;
          this.setState({ webcamAllowed: true });
        })
        .catch(err => {
          console.log(err);
          this.setState({ webcamAllowed: false })
          throw new Error('webc')
        });
    }
  };

  componentDidMount() {
    Promise.all([
      this.faceDetector.loadModel(),
      this.emotionDetector.loadModel(),
      this.ageGenderDetector.loadModel(),
    ])
      .then(() => this.setState({ modelsLoaded: true }))
      .then(this.connectToWebcam)
      // wait for it to initialize and start capturing
      .then(() => this.delay(1000))
      // use throttling to reduce the load on the client
      .then(_.throttle(this.detectFace, 50))
      .catch(console.log)

      this.adDisplay();
  }

  componentWillUnmount() {
    clearInterval(this.interval)
    clearInterval(this.timer)
  }

  startTimer() {
      this.timer = setTimeout(this.adDisplay, 1000);
  }

  detectFace = async () => {
    try {
      const face = await this.faceDetector.detectFace(this.webcam.current);
      if (face.length > 0) {
        const emotionPredictions = await this.emotionDetector.predict(face[0]);
        const [genderPrediction] = await this.ageGenderDetector.predict(face[0]);
        if (emotionPredictions != null) {
          this.setState({ emotionPredictions })
        }
        if (genderPrediction != null) {
          // if the confidence is less than 60% just ignore it
          if (genderPrediction > 0.40 && genderPrediction < 0.60) {
            return this.detectFace();
          }
          const gender = genderPrediction < 0.50 ? 'Male' : 'Female';
          this.setState({ gender });
        }
      }
      return this.detectFace();
    } catch (e) {
      console.log(e);
      return null;
    }
  };

  renderApp = (color) => {
    if (!this.state.webcamAllowed) {
      return null;
    }
    return (
      <div className="result-wrapper">
        {this.state.gender && (
          <div>
            <span>Gender: </span>
            <span style={{color}}>{this.state.gender}</span>
          </div>
        )}
        {this.state.emotionPredictions.map(({ label, value }) => <Result key={label} label={label} value={value}/>)}
      </div>
    );
  }

  adDisplay(){
   
    this.timer = setInterval(()=>{
      const index = Math.floor(Math.random()*5);
      let seconds = this.state.counter - 1;
      if(seconds <= 0) {
        seconds = 10;
          if(this.state.gender === 'Male'){
            this.newLink = "images/man/" + index +".jpg";
            this.adIndex = index;
            this.setState({
              link: this.newLink,
              adIndex: index
              });
          }
          else if (this.state.gender === 'Female'){
            this.newLink = "images/woman/" + index+".jpg";
            this.setState({
              link: this.newLink,
            adIndex: index
            });
          }
      }

      this.setState({
        counter: seconds,
      });

    },1000)

  }

  render() {
    const color = this.state.gender === 'Male' ? '#00a8ff' : '#e056fd';
    //this.adDisplay();
    return (
      <div className="App">
        <div className="App-container">
          {this.state.webcamAllowed === false && <h4 style={{ color: '#EA2027' }}>allow webcam access...</h4>}
          <h2 style={{color: 'orange'}}>PIRO - Emotion & Gender</h2>
          <div id="container">
            {this.state.modelsLoaded ? <video autoPlay width={640} height={480} ref={this.webcam} id="videoElement" /> : <span>Downloading models...</span>}
            {this.renderApp(color)}
          </div>
          <div>
          {this.state.webcamAllowed ? 
                        <div>
                        <div>
                        <p style={{display: 'inline'}}>Time: {this.state.counter} AD nr: {this.state.adIndex} next for: </p>
                        <p style={{color,display: 'inline'}}>{this.state.gender}</p>
                        
                        
                        </div>
                        <div>
                        <img src={this.state.link} alt="" width="1000"></img>
                        </div>
                        </div>
            
           : ""}

          </div>
          
        </div>
      </div>
    );
  }
}

export default App;
