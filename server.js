var express = require('express');
var app = express();
const port = process.env.PORT || 5000;
var multer = require('multer')
var cors = require('cors');
const { exec } = require('child_process');
var fs = require('fs');

app.use(cors())

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads')
  },
  filename: function (req, file, cb) {
    var extension = file.originalname.split('.').slice(0).pop();
    var sanitized = file.originalname.replace(extension, '').replace(/\W+/g, '') + "." + extension;
    cb(null, sanitized)
  }
})

var upload = multer({ storage: storage }).single('file')

app.get('/express_backend', (req, res) => {
  res.send({ express: 'YOUR EXPRESS BACKEND IS CONNECTED TO REACT' });
});

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
    exec('ffmpeg -i "uploads/' + uploadedFilename + '" -qscale 0 -y "temp/' + uploadedFilename + '.mp4"', (err, stdout, stderr) => {
      if (err) {
        console.error(`exec error: ${err}`);
        return;
      }
      // Then attach the uploaded audio track
      exec('ffmpeg -i temp/' + uploadedFilename + '.mp4 -i uploads/' + uploadedFilename.slice(13).replace('.webm', '.mp3') + ' -b:a 320k -y downloads/' + uploadedFilename.slice(13).replace('.webm', '') + '.mp4', (err, stdout, stderr) => {
        if (err) {
          console.error(`exec error: ${err}`);
          return;
        }
        // Delete files
        fs.unlink('temp/' + uploadedFilename + '.mp4', function() {
          console.log('deleted file')
        })
        fs.unlink('uploads/' + uploadedFilename.slice(13).replace('.webm', '.mp3'), function() {
          console.log('deleted file')
        })
        fs.unlink('uploads/' + uploadedFilename, function() {
          console.log('deleted file')
        })
        // Return with link
        res.status(200).json({ filename: uploadedFilename.slice(13).replace('.webm', '.mp4') })
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
    return res.status(200).json({ filename: req.file && req.file.filename })
  })
});

app.post('/uploadFrames',function(req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json(err)
    } else if (err) {
      return res.status(500).json(err)
    }
    return res.status(200).json({ filename: req.file && req.file.filename })
  })
});

app.post('/cancel',function(req, res) {
  fs.unlink('uploads/' + req.query.audiofile, function() {
    // console.log('deleted audio file')
  })
});

app.post('/mergeFrames', function(req, res) {
  // convert images to mp4 video
  exec('ffmpeg -framerate ' + req.query.fps + ' -pattern_type glob -i "uploads/'+req.query.timestamp+'*.jpg" -c:v libx264 -s:v 1280x720 -profile:v high -crf 20 -pix_fmt yuv420p -y temp/'+req.query.timestamp+'.mp4', (err, stdout, stderr) => {
    if (err) {
      console.error(`exec error: ${err}`);
      return;
    }
    // Then attach the uploaded audio track
    exec('ffmpeg -i temp/'+req.query.timestamp+'.mp4 -i uploads/' + req.query.audiofile + ' -b:a 320k -y downloads/' + req.query.audiofile.replace('.mp3', '.mp4'), (err, stdout, stderr) => {
      if (err) {
        console.error(`exec error: ${err}`);
        return;
      }
      // Delete files
      fs.unlink('temp/'+req.query.timestamp+'.mp4', function() {
        // console.log('deleted temp mp4')
      })
      fs.readdir('uploads/', (err, files)=>{
        for (var i = 0, len = files.length; i < len; i++) {
          if (files[i].includes(req.query.timestamp)) {
            fs.unlink('uploads/' + files[i], function() {
              // console.log('deleted frame')
            })
          }
       }
      });
      fs.unlink('uploads/' + req.query.audiofile, function() {
        // console.log('deleted audio file')
      })
      // Return with link
      res.status(200).json({ filename: req.query.audiofile.replace('mp3', 'mp4') })
    });
  });

  // upload(req, res, function (err) {
  //   if (err instanceof multer.MulterError) {
  //     return res.status(500).json(err)
  //   } else if (err) {
  //     return res.status(500).json(err)
  //   }
  //   const uploadedFilename = (req.file && req.file.filename)
  //   // Convert webm to mp4
  //   exec('ffmpeg -i "uploads/' + uploadedFilename + '" -qscale 0 -y "temp/' + uploadedFilename + '.mp4"', (err, stdout, stderr) => {
  //     if (err) {
  //       console.error(`exec error: ${err}`);
  //       return;
  //     }
  //     // Then attach the uploaded audio track
  //     exec('ffmpeg -i temp/' + uploadedFilename + '.mp4 -i uploads/' + uploadedFilename.slice(13).replace('.webm', '.mp3') + ' -y downloads/' + uploadedFilename.slice(13).replace('.webm', '') + '.mp4', (err, stdout, stderr) => {
  //       if (err) {
  //         console.error(`exec error: ${err}`);
  //         return;
  //       }
  //       // Delete files
  //       fs.unlink('temp/' + uploadedFilename + '.mp4', function() {
  //         console.log('deleted file')
  //       })
  //       fs.unlink('uploads/' + uploadedFilename.slice(13).replace('.webm', '.mp3'), function() {
  //         console.log('deleted file')
  //       })
  //       fs.unlink('uploads/' + uploadedFilename, function() {
  //         console.log('deleted file')
  //       })
  //       // Return with link
  //       res.status(200).json({ filename: uploadedFilename.slice(13).replace('.webm', '.mp4') })
  //     });
  //   });
  // })
});

var server = app.listen(port, function() {
  console.log(`App running on port ${port}`);
});
server.timeout = 30*60*1000;

