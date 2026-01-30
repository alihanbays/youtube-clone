import express from 'express'
import { spawn } from 'node:child_process';

const app = express();
app.use(express.json());

app.post('/process-video', (req, res) => {
  const inputFilePath = req.body.inputFilePath;
  const outputFilePath = req.body.outputFilePath;
  
  if (!inputFilePath || !outputFilePath) {
    console.log("InputFilePath or OutputFilePath not included!");
    return res.status(400).send("InputFilePath or outputFilePath not included!");
  }

  const ffmpegArgs = [
    "-i",
    inputFilePath,
    "-vf",
    "scale=-2:360",
    outputFilePath
  ];

  const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);
  let stderrOutput = '';

  ffmpegProcess.stderr.on('data', (data) => {
    stderrOutput += data.toString();
  })

  ffmpegProcess.stdin.write('y\n'); 
  ffmpegProcess.stdin.end();

  ffmpegProcess.on('close', (code) => {
    console.log(`child process exited with code ${code}`);

    if (code == 0) {
      res.status(200).send("Successfull!")
    } else {
      console.error(`ffmpeg exited with code ${code}, Error: ${stderrOutput}`);
      res.status(500).send(`ffmpeg exited with code ${code}, Error: ${stderrOutput}`);
    }
  });
});

const port = process.env.port || 3000;

app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}/`);
});
