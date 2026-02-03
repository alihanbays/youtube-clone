import express from 'express'
import { 
  convertVideo,
  deleteProcessedVideo, 
  deleteRawVideo, 
  downloadRawVideo, 
  setupDirectories, 
  uploadProcessedVideo 
} from './storage';

setupDirectories();

const app = express();
app.use(express.json());

app.post('/process-video', async (req, res) => {
  
  let data;
  try {
    const message = Buffer.from(req.body.message.data, 'base64').toString('utf-8');
    data = JSON.parse(message);
  } catch (err) {
    console.log(`/process-video : ${err}`);
    res.status(500).send(`/process-video : ${err}`);
  }
  
  let inputFileName = data.name;
  let processedFileName = `processed-${inputFileName}`;

  await downloadRawVideo(inputFileName);

  try {
    convertVideo(inputFileName, processedFileName);
  } catch (err) {
    console.log(`/process-video > convertVideo : ${err}`);
    deleteRawVideo(inputFileName);
    deleteProcessedVideo(processedFileName);
    return res.status(500).send(`/process-video > convertVideo : ${err}`);
  }

  uploadProcessedVideo(processedFileName);

  await Promise.all([
    deleteRawVideo(inputFileName),
    deleteProcessedVideo(processedFileName)
  ]);

  res.status(200).send("OK!");
});

const port = process.env.port || 3000;

app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}/`);
});
