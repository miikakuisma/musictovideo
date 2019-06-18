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

app.post('/uploadRender',function(req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json(err)
    } else if (err) {
      return res.status(500).json(err)
    }
    console.log(req.file)
    const uploadedFilename = req.file && req.file.filename || 'temp.mp3'
    console.log(uploadedFilename)

    // let fileName = 'test.mp4';

    exec('ffmpeg -i "uploads/' + uploadedFilename + '" -qscale 0 "temp.mp4"', (err, stdout, stderr) => {
      if (err) {
        console.error(`exec error: ${err}`);
        return;
      }

      console.log(`FFMPEG run complete ${stdout}`);
      exec('ffmpeg -i temp.mp4 -i uploads/' + uploadedFilename.replace('.webm', '.mp3') + ' ' + uploadedFilename + '.mp4', (err, stdout, stderr) => {
        if (err) {
          console.error(`exec error: ${err}`);
          return;
        }

        console.log(`Another FFMPEG run complete ${stdout}`);
      });
    });


     
    // let ffmpeg = spawn('ffmpeg', ['-i', `${ req.file }`, '-qscale', '0', `${ fileName }`]);
    // ffmpeg.on('exit', (statusCode) => {
    //   if (statusCode === 0) {
    //      console.log('conversion successful')
    //   }
    // })

    // ffmpeg
    //   .stderr
    //   .on('data', (err) => {
    //     console.log('err:', new String(err))
    //   })

    // exec('ffmpeg -i "'+req.file+'" -qscale 0 "filename.mp4"; ffmpeg -i Lifeline.mp4 -i public/lifeline.mp3 '+req.file+'.mp4; done',
    //   function (error, stdout, stderr) {   
    //     console.log('stdout: ' + stdout);
    //     console.log('stderr: ' + stderr);
    // });
    return res.status(200).send(req.file)
  })
});

app.post('/uploadMusic',function(req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json(err)
    } else if (err) {
      return res.status(500).json(err)
    }
    console.log(req)
    return res.status(200).send(req.file)
  })
});

app.listen(8000, function() {
  console.log('App running on port 8000');
});
