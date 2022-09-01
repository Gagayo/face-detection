const cam = document.getElementById('cam')


function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    stream => cam.srcObject = stream,
    err => console.error(err)
  )
}

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/assets/lib/face-api/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/assets/lib/face-api/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/assets/lib/face-api/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/assets/lib/face-api/models'),
    faceapi.nets.ageGenderNet.loadFromUri('/assets/lib/face-api/models'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('/assets/lib/face-api/models'),
]).then(startVideo)


this.cam.addEventListener('play', async () => {

  const canvas = faceapi.createCanvasFromMedia(cam)

  document.body.append(canvas)

  const displaySize = { width: cam.width, height: cam.height }

  faceapi.matchDimensions(canvas, displaySize)

  setInterval(async () => {

    const detections = await faceapi.detectAllFaces(cam).withFaceLandmarks().withFaceDescriptors()
    const resizedDetections = faceapi.resizeResults(detections, displaySize)

    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)

    this.labeledFaceDescriptors = await this.loadLabeledImages()

    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)
    const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))

    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box
      const drawBox = new faceapi.draw.DrawBox(box, {label: result.toString()})
      drawBox.draw(canvas)
    })

  }, 100)
})


function loadLabeledImages() {

  try{

    const labels = ['Hamid Tahir', 'Matheus Castiglioni']

    return Promise.all(
      labels.map(async label => {
        const descriptions = []
        for (let i = 1; i <= 5; i++) {
          const img = await faceapi.fetchImage(`/assets/lib/face-api/labels/${label}/${i}.jpg`)
          const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
          //descriptions.push(detections.descriptor)
          console.log(detections.descriptor)
        }

        return new faceapi.LabeledFaceDescriptors(label, this.descriptions)
      })
    )

  }
  catch(err){
    console.log(err)
  }

}



