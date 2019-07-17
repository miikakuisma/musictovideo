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
      exec('ffmpeg -i temp/' + uploadedFilename + '.mp4 -i uploads/' + uploadedFilename.slice(13).replace('.webm', '.mp3') + ' -y downloads/' + uploadedFilename.slice(13).replace('.webm', '') + '.mp4', (err, stdout, stderr) => {
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

app.post('/mergeFrames', function(req, res) {
  console.log('now mergeFrames')
  console.log(req.query.timestamp, req.query.frames)

  // convert images to mp4 video

  

  exec('ffmpeg -framerate 2 -pattern_type glob -i "uploads/'+req.query.timestamp+'*.png" -c:v libx264 -r 30 -pix_fmt yuv420p -y temp/out.mp4', (err, stdout, stderr) => {
    if (err) {
      console.error(`exec error: ${err}`);
      return;
    }
    // // Then attach the uploaded audio track
    // exec('ffmpeg -i temp/' + uploadedFilename + '.mp4 -i uploads/' + uploadedFilename.slice(13).replace('.webm', '.mp3') + ' -y downloads/' + uploadedFilename.slice(13).replace('.webm', '') + '.mp4', (err, stdout, stderr) => {
    //   if (err) {
    //     console.error(`exec error: ${err}`);
    //     return;
    //   }
    //   // Delete files
    //   fs.unlink('temp/' + uploadedFilename + '.mp4', function() {
    //     console.log('deleted file')
    //   })
    //   fs.unlink('uploads/' + uploadedFilename.slice(13).replace('.webm', '.mp3'), function() {
    //     console.log('deleted file')
    //   })
    //   fs.unlink('uploads/' + uploadedFilename, function() {
    //     console.log('deleted file')
    //   })
    //   // Return with link
    //   res.status(200).json({ filename: uploadedFilename.slice(13).replace('.webm', '.mp4') })
    // });
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

app.listen(port, function() {
  console.log(`App running on port ${port}`);
});
