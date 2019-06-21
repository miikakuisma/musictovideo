var express = require('express');
var app = express();
var multer = require('multer')
var cors = require('cors');
const { exec } = require('child_process');

app.use(cors())

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

var upload = multer({ storage: storage }).single('file')

app.get('/download/:file(*)',(req, res) => {
  var file = req.params.file;
  res.download('downloads/' + file); 
});


app.post('/uploadRender',function(req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json(err)
    } else if (err) {
      return res.status(500).json(err)
    }
    const uploadedFilename = (req.file && req.file.filename)
    // Convert webm to mp4
    exec('ffmpeg -i "uploads/' + uploadedFilename + '" -qscale 0 "temp/' + uploadedFilename + '.mp4"', (err, stdout, stderr) => {
      if (err) {
        console.error(`exec error: ${err}`);
        return;
      }
      // Then attach the uploaded audio track
      exec('ffmpeg -i temp/' + uploadedFilename + '.mp4 -i uploads/' + uploadedFilename.slice(14).replace('.webm', '.mp3') + ' downloads/' + uploadedFilename.slice(14).replace('.webm', '') + '.mp4', (err, stdout, stderr) => {
        if (err) {
          console.error(`exec error: ${err}`);
          return;
        }
        // Return with link
        res.status(200).json({ filename: uploadedFilename.slice(14).replace('.webm', '.mp4') })
      });
    });
  })
});

app.post('/uploadMusic',function(req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json(err)
    } else if (err) {
      return res.status(500).json(err)
    }
    return res.status(200).send(req.file)
  })
});

app.listen(8000, function() {
  console.log('App running on port 8000');
});
